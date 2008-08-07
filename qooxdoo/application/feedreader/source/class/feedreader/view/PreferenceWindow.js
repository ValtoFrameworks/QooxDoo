/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Fabian Jakobs (fjakobs)
     * Sebastian Werner (wpbasti)
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/* ************************************************************************

#asset(qx/icon/Tango/16/apps/preferences-theme.png)
#asset(qx/icon/Oxygen/16/apps/preferences-theme.png)
#asset(qx/icon/Tango/16/actions/dialog-ok.png)
#asset(qx/icon/Tango/16/actions/dialog-cancel.png)

************************************************************************ */

/**
 * The feed reader preference window
 */
qx.Class.define("feedreader.view.PreferenceWindow",
{
  extend : qx.ui.window.Window,



  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  construct : function()
  {
    this.base(arguments, this.tr("Preferences"), "icon/16/apps/preferences-theme.png");

    // set the properties of the window
    this.set(
    {
      modal         : true,
      showMinimize  : false,
      showMaximize  : false,
      allowMaximize : false
    });

    // Create the content with a helper
    this._addContent();
  },




  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /**
     * Adds the content of the window.
     */
    _addContent : function()
    {
      // Set the layout of the window
      var windowLayout = new qx.ui.layout.VBox(1);
      this.setLayout(windowLayout);
      this.setMinWidth(350);
      
      // Create container for groupBox
      var container = new qx.ui.container.Composite(new qx.ui.layout.VBox());
      var containerDecorator = new qx.ui.decoration.Single(1, "solid", "#4d4d4d");
      container.set({ backgroundColor : "#f6f6f6", padding : 3, decorator : containerDecorator });
      
      // Create and add a groupbox
      var groupBox = new qx.ui.groupbox.GroupBox(this.tr("Language"));
      groupBox.setMargin(6, 4);
      groupBox.setMinWidth(150);
      groupBox.setLayout(new qx.ui.layout.VBox());
      container.add(groupBox);
      this.add(container, { flex : 1 });

      // Create radio manager
      var radioManager = new qx.ui.form.RadioGroup();
      
      // Create the radio buttons for the languages
      var languages = { "de" : "Deutsch", 
                        "en" : "English", 
                        "es" : "Espanol", 
                        "it" : "Italiano" };
      
      var radioButton;
      for (var lang in languages )
      {
        radioButton = new qx.ui.form.RadioButton(languages[lang]);
        radioButton.setValue(lang);
        
        // add to radioManager and groupBox
        radioManager.add(radioButton);
        groupBox.add(radioButton);
      }
      radioManager.getItems()[0].setChecked(true);
 
      // add the button bar
      var buttonBarLayout = new qx.ui.layout.HBox(10, "right");
      var buttonBar = new qx.ui.container.Composite(buttonBarLayout);
      buttonBar.set({ backgroundColor : "#f6f6f6",
                      decorator : containerDecorator,
                      padding   : 6 });
      
      var cancelButton = new qx.ui.form.Button(this.tr("Cancel"), "icon/16/actions/dialog-cancel.png");
      cancelButton.addListener("execute", this.close, this);
      
      var okButton = new qx.ui.form.Button(this.tr("OK"), "icon/16/actions/dialog-ok.png");
      okButton.addListener("execute", function(e){
        var selectedLanguage = radioManager.getSelected().getValue();
        qx.locale.Manager.getInstance().setLocale(selectedLanguage);
        
        this.close();
      }, this);
      
      buttonBar.add(cancelButton);
      buttonBar.add(okButton);
      
      this.add(buttonBar);
    }
  }
});
