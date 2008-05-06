/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's left-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/* ************************************************************************

#use(qx.event.handler.DragDrop)

************************************************************************ */

/**
 */
qx.Class.define("qx.ui.slider.AbstractSlider",
{
  extend : qx.ui.core.Widget,



  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  construct : function(orientation)
  {
    this.base(arguments);

    // Force canvas layout
    this._setLayout(new qx.ui.layout.Canvas());

    // Add user events
    this.addListener("mousedown", this._onMouseDown, this);
    this.addListener("mouseup", this._onMouseUp, this);
    this.addListener("losecapture", this._onMouseUp, this);
    this.addListener("mousewheel", this._onMouseWheel, this);

    // Create knob
    this._knob = new qx.ui.core.Widget();
    this._knob.setAppearance("slider-knob");
    this._add(this._knob);

    // Initialize orientation
    if (orientation != null) {
      this.setOrientation(orientation);
    } else {
      this.initOrientation();
    }

    // Resize handling
    this.addListener("resize", this._onResize, this);
    this._knob.addListener("resize", this._onResize, this);
  },




  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    /** Whether the slider is horizontal or vertical. */
    orientation :
    {
      check : [ "horizontal", "vertical" ],
      init : "horizontal",
      apply : "_applyOrientation"
    },


    /** The current slider value */
    value :
    {
      check : "Integer",
      init : 0,
      apply : "_applyValue",
      event : "change"
    },


    /**
     * The minimum slider value (may be nagative). This value must be smaller
     * than {@link #maximum}.
     */
    minimum :
    {
      check : "Integer",
      init : 0,
      apply : "_applyMinimum"
    },


    /**
     * The maximum slider value. This value must be larger than {@link #minimum}.
     */
    maximum :
    {
      check : "Integer",
      init : 100,
      apply : "_applyMaximum"
    },


    /** The amount to increment on each event. Typically corresponds to the user pressing an arrow key. */
    singleStep :
    {
      check : "Integer",
      init : 1
    },


    /** The amount to increment on each event. Typically corresponds to the user pressing PageUp or PageDown. */
    pageStep :
    {
      check : "Integer",
      init : 10
    }
  },




  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /*
    ---------------------------------------------------------------------------
      EVENT HANDLER
    ---------------------------------------------------------------------------
    */

    /**
     * Listener of mousedown event. Initializes drag or tracking mode.
     *
     * @type member
     * @param e {qx.event.type.Mouse} Incoming event object
     * @return {void}
     */
    _onMouseDown : function(e)
    {
      var isHorizontal = this.getOrientation() === "horizontal";
      var knob = this._knob;

      var locationProperty = isHorizontal ? "left" : "top";
      var sizeProperty = isHorizontal ? "width" : "height";

      var knobSize = knob.getBounds()[sizeProperty];

      var cursorLocation = isHorizontal ? e.getDocumentLeft() : e.getDocumentTop();
      var sliderLocation = qx.bom.element.Location.get(this.getContentElement().getDomElement())[locationProperty];
      var knobLocation = qx.bom.element.Location.get(knob.getContainerElement().getDomElement())[locationProperty];

      if (e.getTarget() === knob)
      {
        // Switch into drag mode
        this.__dragMode = true;

        // Compute dragOffset (includes both: inner position of the widget and cursor position on knob)
        this.__dragOffset = cursorLocation + sliderLocation - knobLocation;

        // Register move listener
        this.addListener("mousemove", this._onKnobMove);

        // Activate capturing
        this.capture();
      }
      else
      {
        // Switch into tracking mode
        this.__trackingMode = true;

        // Compute relative position
        var relPosition = cursorLocation - sliderLocation;
        if (cursorLocation >= knobLocation) {
          relPosition -= knobSize;
        }

        // Detect tracking direction and position
        this.__trackingDirection = cursorLocation <= knobLocation ? -1 : 1;
        this.__trackingPosition = relPosition;
        this.__trackingValue = this._positionToValue(relPosition);

        // Initialize timer
        if (!this.__timer)
        {
          this.__timer = new qx.event.Timer(100);
          this.__timer.addListener("interval", this._onInterval, this);
        }

        // Start timer
        this.__timer.start();

        // Activate capturing
        this.capture();
      }
    },


    /**
     * Listener of mouseup event. Used for cleanup of previously
     * initialized modes.
     *
     * @type member
     * @param e {qx.event.type.Mouse} Incoming event object
     * @return {void}
     */
    _onMouseUp : function(e)
    {
      if (this.__dragMode)
      {
        // Remove move listener again
        this.removeListener("mousemove", this._onKnobMove);

        // Release capture mode
        this.releaseCapture();

        // Cleanup status flags
        delete this.__dragMode;
        delete this.__dragOffset;
      }
      else if (this.__trackingMode)
      {
        // Stop timer interval
        this.__timer.stop();

        // Release capture mode
        this.releaseCapture();

        // Cleanup status flags
        delete this.__trackingMode;
        delete this.__trackingDirection;
        delete this.__trackingValue;
      }
    },


    /**
     * Listener of interval event by the internal timer. Only used
     * in tracking sequences.
     *
     * @type member
     * @param e {qx.event.type.Event} Incoming event object
     * @return {void}
     */
    _onInterval : function(e)
    {
      // Compute new value
      var value = this.getValue() + (this.__trackingDirection * this.getPageStep())

      // Limit value
      if (value < this.getMinimum()) {
        value = this.getMinimum();
      } else if (value > this.getMaximum()) {
        value = this.getMaximum();
      }

      // Stop at tracking position (where the mouse is pressed down)
      var toBegin = this.__trackingDirection == -1;
      if ((toBegin && value <= this.__trackingValue) || (!toBegin && value >= this.__trackingValue))
      {
        this.scrollTo(this.__trackingValue);

        // Slightly correct position to be in sync
        // with what the user expects.
        this._setSliderPosition(this.__trackingPosition);
      }
      else
      {
        // Finally, scroll to the desired position
        this.scrollTo(value);
      }
    },


    /**
     * Listener of mousmove event for the knob. Only used in drag mode.
     *
     * @type member
     * @param e {qx.event.type.Mouse} Incoming event object
     * @return {void}
     */
    _onKnobMove : function(e)
    {
      var isHorizontal = this.getOrientation() === "horizontal";
      var dragStop = isHorizontal ? e.getDocumentLeft() : e.getDocumentTop();
      var position = dragStop - this.__dragOffset;

      this.scrollTo(this._positionToValue(position));
    },


    /**
     * Listener of mousewheel event
     *
     * @type member
     * @param e {qx.event.type.Mouse} Incoming event object
     * @return {void}
     */
    _onMouseWheel : function(e)
    {
      this.scrollBy(e.getWheelDelta() * this.getSingleStep());
      e.stopPropagation();
    },


    /**
     * Listener of resize event for both the slider itself and the knob.
     *
     * @type member
     * @param e {qx.event.type.Data} Incoming event object
     * @return {void}
     */
    _onResize : function(e)
    {
      var availSize = this.getComputedInnerSize();
      var knobSize = this._knob.getBounds();

      if (this.getOrientation() === "horizontal") {
        this.__availSlidingSpace = availSize.width - knobSize.width;
      } else {
        this.__availSlidingSpace = availSize.height - knobSize.height;
      }

      this._updateSliderPosition();
    },





    /*
    ---------------------------------------------------------------------------
      UTILS
    ---------------------------------------------------------------------------
    */

    /** {Integer} Available space for knob to slide on, computed on resize of the widget */
    __availSlidingSpace : 0,


    /**
     *
     *
     */
    _positionToValue : function(position)
    {
      // Reading available space
      var avail = this.__availSlidingSpace;

      // Protect undefined value (before initial resize) and division by zero
      if (avail == null || avail == 0) {
        return 0;
      }

      // Compute and limit percent
      var percent = position / avail;
      if (percent < 0) {
        percent = 0;
      } else if (percent > 1) {
        percent = 1;
      }

      // Compute range
      var range = Math.abs(this.getMaximum() - this.getMinimum());

      // Compute value
      return this.getMinimum() + Math.round(range * percent);
    },


    /**
     *
     *
     */
    _valueToPosition : function(value)
    {
      // Reading available space
      var avail = this.__availSlidingSpace;
      if (avail == null) {
        return 0;
      }

      // Correcting value
      value = value + Math.abs(this.getMinimum());

      // Computing range
      var range = Math.abs(this.getMaximum() - this.getMinimum());

      // Protect division by zero
      if (range == 0) {
        return 0;
      }

      // Compute and limit percent
      var percent = value / range;
      if (percent < 0) {
        percent = 0;
      } else if (percent > 1) {
        percent = 1;
      }

      // Compute position from available space and percent
      return Math.round(avail * percent);
    },


    /**
     *
     *
     */
    _updateSliderPosition : function() {
      this._setSliderPosition(this._valueToPosition(this.getValue()));
    },



    /**
     *
     *
     */
    _setSliderPosition : function(position)
    {
      if (this.getOrientation() === "horizontal") {
        var props = {left:position};
      } else {
        var props = {top:position};
      }

      this._knob.setLayoutProperties(props);
    },





    /*
    ---------------------------------------------------------------------------
      SCROLL METHODS
    ---------------------------------------------------------------------------
    */

    /**
     *
     *
     */
    scrollForward : function() {
      this.scrollBy(this.getSingleStep());
    },


    /**
     *
     *
     */
    scrollBack : function() {
      this.scrollBy(-this.getSingleStep());
    },


    /**
     *
     *
     */
    scrollPageForward : function() {
      this.scrollBy(this.getPageStep());
    },


    /**
     *
     *
     */
    scrollPageBack : function() {
      this.scrollBy(-this.getPageStep());
    },


    /**
     *
     *
     */
    scrollBy : function(offset) {
      this.scrollTo(this.getValue() + offset);
    },


    /**
     *
     *
     */
    scrollTo : function(value)
    {
      if (value < this.getMinimum()) {
        value = this.getMinimum();
      } else if (value > this.getMaximum()) {
        value = this.getMaximum();
      }

      this.setValue(value);
    },





    /*
    ---------------------------------------------------------------------------
      PROPERTY APPLY ROUTINES
    ---------------------------------------------------------------------------
    */

    // property apply
    _applyOrientation : function(value, old)
    {
      var isHorizontal = value === "horizontal";
      var knob = this._knob;

      this.setAllowStretchX(isHorizontal);
      this.setAllowStretchY(!isHorizontal);

      if (isHorizontal)
      {
        this.removeState("vertical");
        knob.removeState("vertical");

        this.addState("horizontal");
        knob.addState("horizontal");
      }
      else
      {
        this.removeState("horizontal");
        knob.removeState("horizontal");

        this.addState("vertical");
        knob.addState("vertical");
      }

      if (isHorizontal) {
        knob.setLayoutProperties({top:0, right:null, bottom:0});
      } else {
        knob.setLayoutProperties({right:0, bottom:null, left:0});
      }

      this._updateSliderPosition();
    },


    // property apply
    _applyValue : function(value, old) {
      this._updateSliderPosition();
    },


    // property apply
    _applyMinimum : function(value, old) {
      this._updateSliderPosition();
    },


    // property apply
    _applyMaximum : function(value, old) {
      this._updateSliderPosition();
    }
  }
});
