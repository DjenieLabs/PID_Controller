// ************************************************************************************************************
// Written by Alexander Agudelo <alex.agudelo@asurantech.com>, 2016
// Date: 30/Dec/2016
// Description: Basic PID Controller
//
// ------
// Copyright (C) Asuran Technologies - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential.
// ************************************************************************************************************

define(['HubLink', 'RIB', 'PropertiesPanel', 'Easy'], function(Hub, RIB, Ppanel, easy) {
  var actions = ["Update"];
  var inputs = ["Output"];
  var _objects = {};

  var PIDController = {
    settings:{
      Custom: {}
    },
    dataFeed: {}
  };

  // TODO: Review if this is a trully unique instance?

  PIDController.getActions = function() {
    return actions;
  };

  PIDController.getInputs = function() {
    return inputs;
  };

  /**
   * Use this method to control the visibility of the DataFeed
   * By default it will show() the DataFeed, change it to true due to hide it. 
   */
  PIDController.hideDataFeed = function() {
    return true;
  };

  /**
   * Triggered when added for the first time to the side bar.
   * This script should subscribe to all the events and broadcast
   * to all its copies the data.
   * NOTE: The call is bind to the block's instance, hence 'this'
   * does not refer to this module, for that use 'PIDController'
   */
  PIDController.onLoad = function(){
    this._settingsSet = false;
    var that = this;
    
    // Load my properties template
    this.loadTemplate('properties.html').then(function(template){
      that.propTemplate = template;
    });


    // Load Dependencies
    var libPath = this.basePath + 'libs/pid-controller/';
    require([libPath+'index.js'], function(controller){
      that.__Controller = controller;
      console.log("PID library loaded");
    });

     // Load previously stored settings
    if(this.storedSettings && this.storedSettings.gainValues){
      this.gainValues = this.storedSettings.gainValues;
    }else{
      // Stores the list of codes
      this.gainValues = {
        Kp: 1,
        Ki: 1,
        Kd: 1,
        target: 1
      };
    }
  };

  /**
   * When hasMissingProperties returns <true>
   * the properties windown will be open automatically after clicking the 
   * canvas block
   */
  PIDController.hasMissingProperties = function() {
    // Define a logic you want to return true and open the properties window
    return !this._settingsSet;
  };

  /**
   * Parent is asking me to execute my logic.
   * This block only initiate processing with
   * actions from the hardware.
   * @param event is an object that contains action and data properties.
   */
  PIDController.onExecute = function(event) {
    if(this._ctrl){
      if(event.action === 'Update'){
        // event.data should contain the current value to be corrected
        var correction = this._ctrl.update(event.data);
        if(correction != 0){
          // Send my data to anyone listening
          this.dispatchDataFeed({output: correction});
          // Send data to logic maker for processing
          this.processData({output: correction}); 
        }
      }
    }
  };

  /**
   * This method is called when the user hits the "Save"
   * recipe button. Any object you return will be stored
   * in the recipe and can be retrieved during startup (@onLoad) time.
   */
  PIDController.onBeforeSave = function(){
    return {gainValues: this.gainValues};
  };

  /**
   * Intercepts the properties panel closing action.
   * Return "false" to abort the action.
   * NOTE: Settings Load/Saving will atomatically
   * stop re-trying if the event propagates.
   */
  PIDController.onCancelProperties = function(){
    console.log("Cancelling Properties");
  };

  /**
   * Intercepts the properties panel save action.
   * You must call the save method directly for the
   * new values to be sent to hardware blocks.
   * @param settings is an object with the values
   * of the elements rendered in the interface.
   * NOTE: For the settings object to contain anything
   * you MUST have rendered the panel using standard
   * ways (easy.showBaseSettings and easy.renderCustomSettings)
   */
  PIDController.onSaveProperties = function(settings){
    console.log("Saving: ", settings);
    
    this.gainValues.Kp = settings.Kp;
    this.gainValues.Ki = settings.Ki;
    this.gainValues.Kd = settings.Kd;
    this.gainValues.target = settings.target;

    // Create/replace a PID Controller instance
    this._ctrl = new this.__Controller({
      k_p: this.gainValues.Kp,
      k_i: this.gainValues.Ki,
      k_d: this.gainValues.Kd/*,
      dt: 1/25*/
    });

    this._ctrl.setTarget(this.gainValues.target);
  };

  /**
   * Triggered when the user clicks on a block.
   * The interace builder is automatically opened.
   * Here we must load the elements.
   * NOTE: This is called with the scope set to the
   * Block object, to emailsess this modules properties
   * use PIDController or this.controller
   */
  PIDController.onClick = function(){
    var that = this;
    easy.clearCustomSettingsPanel();

    // Compile template using current list
    this.myPropertiesWindow = $(this.propTemplate(this.gainValues));
    // Display elements
    easy.displayCustomSettings(this.myPropertiesWindow, true);
  };

  /**
   * Parent is send new data (using outputs).
   */
  PIDController.onNewData = function() {};

  return PIDController;
});
