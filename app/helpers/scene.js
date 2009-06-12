/**
 * helpers for scene assistants in Spaz on Mojo 
 */
var scene_helpers = {}


/**
 * This adds a number of common scene methods to the passed scene assistant
 * @param {object} assistant a scene assistant
 */
scene_helpers.addCommonSceneMethods = function(assistant) {
	
	
	assistant.initAppMenu = function(opts) {

		var default_items = [
			Mojo.Menu.editItem,
			// { label: $L('New Search Card'),	command: 'new-search-card' },
			{ label: $L('Preferences...'),	command:Mojo.Menu.prefsCmd },
			{ label: $L('About Spaz'),		command: 'appmenu-about' },
			{ label: $L('Help...'),			command:Mojo.Menu.helpCmd }
		];

		if (!opts) {
			opts = {
				'items':default_items
			};
		} else if (!opts.items) {
			opts.items = default_items;
		}
		
		// the initial app/scene commands set into the class's appMenuModel for the beverage:
		this.appMenuAttr  = {
			omitDefaultItems: true
		};
		
		this.appMenuModel = {
			visible: true,
			items: opts.items
		};

		// good to go, set up the almighty Application Menu:
		this.controller.setupWidget(Mojo.Menu.appMenu, this.appMenuAttr, this.appMenuModel);
	};
	

	/**
	 * opts is an object with key:val pairs, like so
	 * {
	 *	viewMenuLabel:'My Timeline';
	 *	switchMenuLabel:'View';
	 * } 
	 */
	assistant.setupCommonMenus = function(opts) {
		
		if (!this.scroller) {
			this.scroller = this.controller.getSceneScroller();
		}
		
		/*
			View menu at top of screen
		*/
		if (opts.viewMenuItems) {
			var viewMenuItems = opts.viewMenuItems;
			this.viewMenuModel = {
				label: $L('viewmenu'), 
				items: viewMenuItems,
			};
			this.controller.setupWidget(Mojo.Menu.viewMenu, undefined, this.viewMenuModel);
		}
		

		/*
			Command menu at bottom of screen
		*/
		if (opts.cmdMenuItems) {
			var cmdMenuItems = opts.cmdMenuItems;
			this.cmdMenuModel = {
				visible:true,
				items: cmdMenuItems
			};
			this.controller.setupWidget(Mojo.Menu.commandMenu, undefined, this.cmdMenuModel);
		}

	};


	assistant.createStage = function(sceneName, sceneArgs, stageName) {
		// "nocache:true" tells sysmanager to not use the card caching strategy on compose cards
		var params = {name: stageName, assistantName:'StageLightweightSearchAssistant'};
		var callback = function(stageController) {
			stageController.pushScene(sceneName, sceneArgs, stageName);
		};
		Mojo.Controller.getAppController().createStageWithCallback(params, callback);
	};

	/**
	 * these are all sceneAssistant-specific calls. More are in Stage and App assistants
	 */
	assistant.handleCommand = function(event){
		
		dump(event)
		dump(event.command);
		
		if (event.type == Mojo.Event.command) {
			switch (event.command) {

				/*
					timeline filtering
				*/
				case 'filter-timeline-all':
				case 'filter-timeline-replies-dm':
				case 'filter-timeline-replies':
				case 'filter-timeline-dms':
					/*
						This is actually only defined in MyTimeline
					*/
					this.filterTimeline(event.command);
					break;
				
				case 'new-search-card':

					sc.app.new_search_card++;
					this.createStage('search-twitter', { 'lightweight':true }, sc.app.search_card_prefix+sc.app.new_search_card);

					break;
					
				case 'update-location':
					this.showLocationPanel();
					break;
					
				/*
					Compose a new message
				*/
				case 'compose':
					this.showPostPanel();
					break;

				/*
					Scroll to top
				*/
				case 'scroll-top':
					dump("Scroll to top");
					this.scrollToTop();
					break;
				/*
					Scroll to bottom
				*/
				case 'scroll-bottom':
					dump("Scroll to bottom");
					this.scrollToBottom();
					break;

				/*
					Scroll to first (last in list) new item
				*/
				case 'scroll-new':
					dump("Scroll to new");
					this.scrollToNew();
					break;

				
				/*
					This would refresh the current view
				*/
				case 'refresh':
					this.refresh(); // need to have a "refresh" method defined for each scene asst
					break;

			}
		}
	}
	
	
	/**
	 *  
	 */
	assistant.scrollToTop = function() {
		if (!this.scroller) {
			this.scroller = this.controller.getSceneScroller();
		}
		dump('Scrolling to top');
		jQuery(this.scroller).scrollTo( {'top':0,'left':0}, { axis:'y', duration:0 } );
	};
	
	/**
	 *  
	 */
	assistant.scrollToBottom = function() {
		if (!this.scroller) {
			this.scroller = this.controller.getSceneScroller();
		}
		dump('Scrolling to bottom');
		jQuery(this.scroller).scrollTo( jQuery(this.scroller).height(), { axis:'y', duration:0 } );
	};
	
	/**
	 *  
	 */
	assistant.scrollToNew = function() {
		if (!this.scroller) {
			this.scroller = this.controller.getSceneScroller();
		}
		var num_new   = jQuery('.timeline>div.timeline-entry.new:visible', this.scroller).length;
		var first_new = jQuery('.timeline>div.timeline-entry.new:visible:last', this.scroller).get(0);
		
		if (first_new) {
			dump('Scrolling to first new item');
			if (num_new == 1) { // if only one new, just scroll to the top
				this.scrollToTop();
			} else {
				jQuery(this.scroller).scrollTo(first_new, { axis:'y', duration:0, offset:{top:-100} });				
			}
		} else {
			dump('No new items to scroll to');
		}
	};


	/**
	 *  
	 */
	assistant.filterTimeline = function(command) {
		
		if (!command) {
			command = this.filterState;
		}
		
		switch (command) {
			case 'filter-timeline-all':
				jQuery('#my-timeline div.timeline-entry').show();
				break;
			case 'filter-timeline-replies-dm':
				jQuery('#my-timeline div.timeline-entry').hide();
				jQuery('#my-timeline div.timeline-entry.reply, #my-timeline div.timeline-entry.dm').show();
				break;
			case 'filter-timeline-replies':
				jQuery('#my-timeline div.timeline-entry').hide();
				jQuery('#my-timeline div.timeline-entry.reply').show();
				break;
			case 'filter-timeline-dms':
				jQuery('#my-timeline div.timeline-entry').hide();
				jQuery('#my-timeline div.timeline-entry.dm').show();
				break;
			default:
				jQuery('#my-timeline div.timeline-entry').show();
		}
		
		this.filterState = command;	
	};
	
	
	
	assistant.showLocationPanel = function(event) {
		this.controller.showDialog({
	          template: 'shared/location-popup',
	          assistant: new LocationDialogAssistant(this),
	          preventCancel:false
	    });
	};
	
	

	/**
	 *  
	 */
	assistant.addPostPopup = function(event) {

		alert('DEPRECATED');

		
	}
	
	
	assistant.initTwit = function() {
		// var username = sc.app.prefs.get('username');
		// var password = sc.app.prefs.get('password');

		this.twit = new scTwit();
		this.twit.setSource(sc.app.prefs.get('twitter-source'));

		if (sc.app.username && sc.app.password) {
			// alert('seetting credentials for '+sc.app.username);
			this.twit.setCredentials(sc.app.username, sc.app.password);
		} else {
			// alert('NOT seetting credentials for!');
		}
	};
	


	/**
	 *  
	 */
	assistant.removePostPopup = function(event) {
		
		alert('DEPRECATED');
		
	}


	assistant.showLocationPanel = function(event) {
		this.controller.showDialog({
	          template: 'shared/location-popup',
	          assistant: new LocationDialogAssistant(this),
	          preventCancel:false
	    });
	};
	
	assistant.showPostPanel = function(event) {
		this.controller.showDialog({
	          template: 'shared/post-popup',
	          assistant: new PostDialogAssistant(this),
	          preventCancel:false
	    });
	};
	
	
	/**
	 *  
	 */
	assistant.prepMessage = function() {
		this.showPostPanel();
		var eb = jQuery('#post-panel-textarea', this.controller.getSceneScroller());
		eb.val('');
		eb[0].setSelectionRange(0, 0);
	};

	
	/**
	 *  
	 */
	assistant.prepRetweet = function(entryobj) {
		this.showPostPanel();
		var text = entryobj.SC_text_raw;
		var screenname = entryobj.user.screen_name;

		var rtstr = 'RT @' + screenname + ': '+text+'';

		if (rtstr.length > 140) {
			rtstr = rtstr.substr(0,139)+'…';
		}

	    var eb = jQuery('#post-panel-textarea', this.controller.getSceneScroller());
		eb.focus();
		eb.val(rtstr);
		eb[0].setSelectionRange(eb.val().length, eb.val().length);
		
		// this._updateCharCount();

	};

	/**
	 *  
	 */
	assistant.prepDirectMessage = function(username) {
		this.showPostPanel();
	    var eb = jQuery('#post-panel-textarea', this.controller.getSceneScroller());
	    eb.focus();
	    if (username) {
	        eb.val('d ' + username + ' ...');
	        eb[0].setSelectionRange(eb.val().length - 3, eb.val().length)
	    } else {
	        eb.val('d username');
	        eb[0].setSelectionRange(2, eb.val().length);
	    }
	
		// this._updateCharCount();

	};



	/**
	 *  
	 */
	assistant.prepPhotoPost = function(url) {
	    
		this.showPostPanel();
		var eb = jQuery('#post-panel-textarea', this.controller.getSceneScroller());
	    eb.focus();
	    if (url) {
	        eb.val(url + ' desc');
	        eb[0].setSelectionRange(eb.val().length - 4, eb.val().length);
	        return true;
	    } else {
	        return false;
	    }
	
		// this._updateCharCount();

	}



	/**
	 *  
	 */
	assistant.prepReply = function(username, status_id) {
		this.showPostPanel();
	
		var eb = jQuery('#post-panel-textarea', this.controller.getSceneScroller());
	    eb.focus();

	    if (username) {
	        var newText = '@' + username + ' ';

	        if (eb.val() != '') {
	            eb.val(newText + eb.val());
	            eb[0].setSelectionRange(eb.val().length, eb.val().length);
	        } else {
	            eb.val(newText);
	            eb[0].setSelectionRange(eb.val().length, eb.val().length);
	        }
	    } else {
	        var newText = '@';
	        if (eb.val() != '') {
	            eb.val(newText + ' ' + eb.val());
	        } else {
	            eb.val('@');
	        }
	        eb[0].setSelectionRange(newText.length, newText.length);
	    }
		
		if (status_id) {
			// get the status text
			this.setPostIRT(status_id, this.statusobj)
		} else {
			
		}
		
		// this._updateCharCount();
	};



	/**
	 *  
	 */
	assistant.setPostIRT = function(status_id, statusobj) {
		if (statusobj && statusobj.SC_text_raw) {
			var status_text = statusobj.SC_text_raw;
		} else {
			var status_text = 'status #'+status_id;
		}
		
		// update the GUI stuff
		jQuery('#post-panel-irt-message', this.controller.getSceneScroller())
			.html(status_text)
			.attr('data-status-id', status_id);
		jQuery('#post-panel-irt', this.controller.getSceneScroller()).slideDown('fast');
	};
	

	/**
	 *  
	 */
	assistant.clearPostIRT = function() {
		jQuery('#post-panel-irt', this.controller.getSceneScroller()).slideUp('fast');
		jQuery('#post-panel-irt-message').html('').attr('data-status-id', '0');
	};



	/**
	 * 
	 */
	assistant.searchFor = function(terms, scenetype) {

		var lightweight = false;
		if (scenetype === 'lightweight') {
			lightweight = true;
		}
		
		/*
			if username and pass aren't set, use lightweight version
		*/
		if (!(sc.app.username && sc.app.password)) {
			lightweight = true;
		}
			
		Mojo.Controller.stageController.pushScene("search-twitter", {
			'searchterm': terms,
			'lightweight': lightweight
		});
	}



	
	assistant.setupInlineSpinner = function(id) {
		// alert('setup:'+id);
		this.controller.setupWidget(id, {spinnerSize: Mojo.Widget.spinnerSmall}, {});
	};
	
	assistant.showInlineSpinner = function(id, message) {
		// alert('showing!'+"\n"+id+"\n"+message);

		jQuery('#'+id+'-title').text(message);
		jQuery('#'+id+'-container').show();
		$(id).mojo.start();
		
		dump("SPINNER CONTAINER HTML (start):"+jQuery('#'+id+'-container').get(0).outerHTML);
	};
	
	


	/**
	 *  stops, but does not remove, the spinner
	 */
	assistant.stopInlineSpinner = function(id, message) {
		jQuery('#'+id+'-title').text(message);
		jQuery('#'+id).get(0).mojo.stop();
	};


	/**
	 *  starts an existing spinner
	 */
	assistant.startInlineSpinner = function(id, message) {
		jQuery('#'+id+'-title').text(message);
		jQuery('#'+id+'-container').show();
		jQuery('#'+id).get(0).mojo.start();
	};


	assistant.hideInlineSpinner = function(id) {
		jQuery('#'+id).get(0).mojo.stop();
		jQuery('#'+id+'-container').hide();
	}
	

	/**
	 *  immediately DESTROYS an existing spinner
	 */
	assistant.clearInlineSpinner = function(container) {
		dump("clearing inline spinner");
		jQuery(container).empty();		
	};
	
	
	
	
	assistant.activateButtonSpinner = function(id) {
		var buttonWidget = this.controller.get(button);
		buttonWidget.mojo.activate();
	}

	assistant.deactivateButtonSpinner = function(id) {
		var buttonWidget = this.controller.get(button);
		buttonWidget.mojo.deactivate();
	}
	
	
	
	
	assistant.newMsgBanner = function(count) {
		var launchArgs = {
			'fromstage':this.getStageName()
		};
		var category = 'newMessages';
		var appController = Mojo.Controller.getAppController();

		appController.showBanner("There are "+count+" new messages", launchArgs, category);
	}



	assistant.newSearchResultsBanner = function(count, query) {				
		var category = 'newSearchResults_'+query;
		var appController = Mojo.Controller.getAppController();
		var stageController = appController.getActiveStageController();
		var launchArgs = {
			'fromstage':this.getStageName()
		};
		appController.showBanner(count+" new results for '"+query+"'", launchArgs, category);
	}
	
	
	
	
	assistant.showNotification = function(msg) {
		
	};
	
	
	
	assistant._initSound = function() {

		var makeCue = function(clip) {
			var cue = new Audio();
			cue.src = clip;
			cue.autoplay = false;
			
			return cue;
		};
		
		this.audioCues = {
			'newmsg':  makeCue('sounds/New.mp3'),
			'send':    makeCue('sounds/CSnd.mp3'),
			'receive': makeCue('sounds/CRcv.mp3'),
			'startup': makeCue('sounds/On.mp3'),
			'shutdown':makeCue('sounds/Off.mp3'),
			'wilhelm': makeCue('sounds/wilhelm.mp3')
		};


	}
	
	
	
	assistant.playAudioCue = function(clip) {

		if (!this.audioCues) {
			this._initSound();
		};

		switch(clip) {
			case 'newmsg':
				this.audioCues.newmsg.play();
				break;

			case 'send':
				this.audioCues.send.play();
				break;

			case 'receive':
				this.audioCues.receive.play();
				break;

			case 'startup':
				this.audioCues.startup.play();
				break;

			case 'shutdown':
				this.audioCues.shutdown.play();
				break;

			case 'wilhelm':
				this.audioCues.wilhelm.play();
				break;
		};
	};



	assistant.processAjaxError = function(errobj) {		

		var human_msg, twiterr_req, twiterr_msg;
		
		switch(errobj.msg) {
			case 'timeout':
				
				human_msg = $L('The request timed out – server did not respond in time');
				break;
				
			case 'error':
				
				if (errobj.xhr.status == 400) {
					human_msg = $L('Request limit exceeded');
				} else if (errobj.xhr.status == 401) {
					human_msg = $L('You are not authorized to view this content');
				} else if (errobj.xhr.status == 403) {
					human_msg = $L('You are not authorized to view this content');
				} else if (errobj.xhr.status == 404) {
					human_msg = $L('The requested URL doesn\'t exist');
				} else if (errobj.xhr.status == 500) {
					human_msg = $L('There was an error on the server');
				} else if (errobj.xhr.status == 502) {
					human_msg = $L('Servers are down or being upgraded');
				} else if (errobj.xhr.status == 503) {
					human_msg = $L('Servers are overloaded');
				} else {
					human_msg = $L('Unknown error');
				}
				
				try {
					var twiterr = sch.deJSON(errobj.xhr.responseText);
					twiterr_req = twiterr.request;
					twiterr_msg = twiterr.error;
				} catch (e) {
					dump('Tried to decode JSON from responseText, but failed');
					dump(e.name + ":" + e.message);
				}
				
				break;
				
			case 'notmodified':
			
				human_msg = $L('Not modified');
				
				break;
				
			case 'parsererror':
				
				human_msg = $L('Error parsing XML returned by request');
				
				break;
			
			default:
			
				human_msg = $L('Ajax Error');
				break;
		}
		
		if (errobj.xhr) {
			var error_processed = {
				'status':		errobj.xhr.status,
				'statusText':	errobj.xhr.statusText,
				'responseText':	errobj.xhr.responseText,
				'url':			errobj.url,
				'msg':			errobj.msg,
				'human_msg':	human_msg,
				'twitter_request':	twiterr_req,
				'twitter_msg':	twiterr_msg
			}
		} else {
			var error_processed = {
				'status':		errobj.xhr.status,
				'statusText':	errobj.xhr.statusText,
				'responseText':	errobj.xhr.responseText,
				'url':			errobj.url,
				'msg':			errobj.msg,
				'human_msg':	human_msg,
				'twitter_request':	twiterr_req,
				'twitter_msg':	twiterr_msg
			}
			
		}

		return error_processed;
		
	};
	
	
	assistant.displayErrorInfo = function(msg, errors, template) {
		
		var error_info;
		var error_html = '';
		
		dump(errors);
		
		if (!sch.isArray(errors)) {
			var err = errors;
			errors = [errors];
		}
		
		dump(errors);
		
		if (!template) {
			template = 'error_info';
		} 

		
		if ( errors ) {
			for (var i = 0; i < errors.length; i++) {
				error_info  = this.processAjaxError(errors[i]);
				if (error_html.length>0) {
					error_html += '<hr>';
				}
				error_html += sc.app.tpl.parseTemplate(template, error_info);
			}
		}
				
		Mojo.Controller.errorDialog(msg+"<br>\n"+error_html);
		
	}


	assistant.clearTimelineCache = function(callback) {
		var thisA = this;
		
		// Mojo.Log.info('Timeline Caching disabled for now');
		var cacheDepot = new Mojo.Depot({
			name:'SpazDepotTimelineCache',
			replace:false
		});
		
		var users = sc.app.prefs.get('users');
		
		for (var i=0; i<users.length; i++) {
			var username = users[i].username;
			cacheDepot.simpleAdd(username, {},
				function() { 
					// thisA.showAlert('Cache cleared');
					dump('Cache '+username+' cleared');
				},
				function() { 
					// Mojo.Controller.errorDialog('Cache clearing FAILED');
					dump('Cache '+username+' clear failed');
				}
			);
		}
		
	}
	
	
	/**
	 * This helps us set up listening for the Enter key in a textbox
	 * 
	 * the callback function's 'this' references the assistant 
	 * 
	 * make sure to call stopListeningForEnter when done with the
	 * correct ID so the listener is unbound
	 * 
	 * @param {string} id
	 * @param {function} callback
	 */
	assistant.listenForEnter = function (id, callback){
		Mojo.Event.listen(this.controller.get(id),
			Mojo.Event.propertyChange,
			this._listenerForEnter.bind(this, callback),
			true
		);
	}
	assistant._listenerForEnter = function(callback, event) {
		dump("DUMPING EVENT");
		dump(event);
		dump(event.originalEvent);
		dump("DUMPING CALLBACK");
		dump(callback);
		if (event && Mojo.Char.isEnterKey(event.originalEvent.keyCode)) {
			dump("CALLING CALLBACK");
			callback.call(this);
			return;
		}
	};
	
	/**
	 * removes the listener set up by listenForEnter
	 * 
	 * @param {string} id
	 */
	assistant.stopListeningForEnter = function(id) {
		Mojo.Event.stopListening(this.controller.get(id),
			Mojo.Event.propertyChange,
			this._listenerForEnter
		);
	}
	
	
	/**
	 * A helper to easily display JS alert()-style popups
	 * @param {string} msg  required 
	 * @param {string} title  optional 
	 * @param {function} ok_cb  callback like function(value) where value is value assigned to OK button. Optional
	 */
	assistant.showAlert = function(msg, title, ok_cb, choices) {
		
		var default_choices = [
			{label:$L('Okay'), value:"okay", type:'dismiss'}
		];
		
		opts.title    = title   || 'Alert';
		opts.msg      = msg     || '';
		opts.onChoose = ok_cb   || function() {};
		opts.choices  = choices || default_choices;
		
		this.controller.showAlertDialog({
			'onChoose':opts.onChoose,
			'title':   $L(opts.title),
			'message': $L(opts.msg),
			'choices': opts.choices
		});
	};
	
	
	
	assistant.getStageName = function() {
		if (window.name) {
			var stagename = window.name;
		} else {
			var stagename = 'main';
		}
		return stagename;
	};



	assistant.openInBrowser = function(url) {
		this.controller.serviceRequest("palm://com.palm.applicationManager", {
		  method: "open",
		  parameters:  {
		      id: 'com.palm.app.browser',
		      params: {
		          target: url
		      }
		  }
		});
	};
	
	
	assistant.trackStageActiveState = function() {
		this.isFullScreen = true;
		this.controller.listen(this.controller.sceneElement, Mojo.Event.stageDeactivate, this._setNotFullScreen.bind(this));
		this.controller.listen(this.controller.sceneElement, Mojo.Event.stageActivate, this._setFullScreen.bind(this));
	};

	assistant.stopTrackingStageActiveState = function() {
		this.controller.stopListening(this.controller.sceneElement, Mojo.Event.stageDeactivate, this._setNotFullScreen);
		this.controller.stopListening(this.controller.sceneElement, Mojo.Event.stageActivate, this._setFullScreen);
	};

	assistant._setNotFullScreen = function(event) {
		this.isFullScreen = false;//send notifications
	};
	assistant._setFullScreen = function(event) {
		this.isFullScreen = true; //dont send notifications
	};
	
	
}












/*
	Small controller class used for the new account dialog
*/
var PostDialogAssistant = Class.create({
	
	initialize: function(sceneAssistant) {
		this.sceneAssistant = sceneAssistant;
		this.controller = sceneAssistant.controller;
	},
	
	setup : function(widget) {
		this.widget = widget;
		
		this.postButtonAttributes = {
			type: Mojo.Widget.activityButton
		};
		this.postButtonModel = {
			buttonLabel : "Post",
			buttonClass: 'Primary'
		};
		
		this.controller.setupWidget('post-send-button', this.postButtonAttributes, this.postButtonModel);

		
	},
	
	activate: function() {
		var thisA = this;
		/*
			What to do if we succeed
			Note that we pass the assistant object as data into the closure
		*/				

		Mojo.Event.listen($('post-send-button'), Mojo.Event.tap, this.sendPost.bind(this));

		jQuery('#post-panel-username').text(sc.app.username);

		
		/*
			if update succeeds
		*/
		jQuery().bind('update_succeeded', { thisAssistant:this }, function(e, data) {
			e.data.thisAssistant.renderSuccessfulPost(e, data);
		});

		/*
			if update fails
		*/
		jQuery().bind('update_failed', { thisAssistant:this }, function(e, error_obj) {
			e.data.thisAssistant.reportFailedPost(error_obj);
		});

				
		jQuery('#post-panel-textarea').bind('keyup',   function(e) {
			thisA._updateCharCount();
		});
		jQuery('#post-panel-textarea').bind('keydown', function(e) {
			thisA._updateCharCount();
		});
		jQuery('#post-panel-textarea').bind('blur',    function(e) {
			thisA._updateCharCount();
		});
		jQuery('#post-panel-textarea').bind('focus',   function(e) {
			thisA._updateCharCount();
		});
				
		jQuery('#post-panel-irt-dismiss').bind(Mojo.Event.tap, function(e) {
			thisA.clearPostIRT();
		});


	},
	
	
	deactivate: function() {
		Mojo.Event.stopListening($('post-send-button'), Mojo.Event.tap, this.sendPost); 
				
		jQuery('#post-panel-textarea').unbind('keyup');
		jQuery('#post-panel-textarea').unbind('keydown');
		jQuery('#post-panel-textarea').unbind('blur');
		jQuery('#post-panel-textarea').unbind('focus');
		
		jQuery('#post-panel-irt-dismiss').unbind(Mojo.Event.tap);
		
		jQuery().unbind('update_succeeded');
		jQuery().unbind('update_failed');
		
	},
	
	
	
	
	/**
	 * @private 
	 */
	_updateCharCount: function() {
		var thisA = this;
		
		if (thisA._updateCharCountTimeout) {
			clearTimeout(thisA._updateCharCountTimeout);
		}

		function _updateCharCountNow() {
			var numchars  = document.getElementById('post-panel-textarea').value.length;
			var charcount = 140 - numchars;
			document.getElementById('post-panel-counter-number').innerHTML = charcount.toString();
			if (charcount < 0) {
				jQuery('#post-panel-counter', thisA.controller.getSceneScroller()).addClass('over-limit');
				/*
					disable post send button
				*/
				jQuery('#post-send-button', thisA.controller.getSceneScroller()).attr('disabled', 'disabled');
			} else {
				jQuery('#post-panel-counter', thisA.controller.getSceneScroller()).removeClass('over-limit');
				/*
					enable post send button
				*/
				jQuery('#post-send-button', thisA.controller.getSceneScroller()).attr('disabled', '');
			}	
		};
		
		this._updateCharCountTimeout = setTimeout(_updateCharCountNow, 500);
		
		
	},
	
	
	
	clearPostPanel: function() {
		this.clearPostIRT();
		jQuery('#post-panel-textarea', this.controller.getSceneScroller()).val('');
		this._updateCharCount();
	},


	clearPostIRT: function() {
		jQuery('#post-panel-irt', this.controller.getSceneScroller()).slideUp('fast');
		jQuery('#post-panel-irt-message').html('').attr('data-status-id', '0');
	},


	/**
	 *  
	 */
	sendPost: function(event) {
		var status = jQuery('#post-panel-textarea').val();

		if (status.length > 0) {
			
			var in_reply_to = parseInt(jQuery('#post-panel-irt-message', this.controller.getSceneScroller()).attr('data-status-id'));
			
			if (in_reply_to > 0) {
				this.sceneAssistant.twit.update(status, null, in_reply_to);
			} else {
				this.sceneAssistant.twit.update(status, null, null);
			}
			
		}
	},
	
	

	/**
	 *  
	 */
	renderSuccessfulPost: function(event, data) {
		if (sch.isArray(data)) {
			data = data[0];
		}

		data.text = makeItemsClickable(data.text);
		
		/*
			save this tweet to Depot
		*/
		sc.app.Tweets.save(data);
		
		dump(data);

		var itemhtml = sc.app.tpl.parseTemplate('tweet', data);
		


		/*
			prepend the rendered markup to the timeline, so it shows on top
		*/
		if (jQuery('#my-timeline').length == 1) {
			jQuery('#my-timeline').prepend(itemhtml);
		}
			
		


		/*
			remove extra items
		*/
		// sch.removeExtraElements('#my-timeline>div.timeline-entry', sc.app.prefs.get('timeline-maxentries'));
		
		sch.removeExtraElements('#my-timeline>div.timeline-entry:not(.reply):not(.dm)', sc.app.prefs.get('timeline-maxentries'));
		sch.removeExtraElements('#my-timeline>div.timeline-entry.reply', sc.app.prefs.get('timeline-maxentries-reply'));
		sch.removeExtraElements('#my-timeline>div.timeline-entry.dm', sc.app.prefs.get('timeline-maxentries-dm'));
		

		/*
			Update relative dates
		*/
		sch.updateRelativeTimes('div.timeline-entry .meta>.date', 'data-created_at');
		
		/*
			re-apply filtering
		*/
		this.sceneAssistant.filterTimeline();

		this.sceneAssistant.playAudioCue('send');
		
		this.deactivateSpinner();
		
				
		this.hidePostPanel(event);
		// this.clearPostPanel(event);

	},
	
	
	/**
	 *  
	 */
	reportFailedPost: function(error_obj) {
		this.deactivateSpinner();

		var err_msg = $L("There was a problem posting your status");
		this.sceneAssistant.displayErrorInfo(err_msg, error_obj);
		this.hidePostPanel(event);
	},
	
	hidePostPanel: function() {
		this.widget.mojo.close();
	},
	
	deactivateSpinner: function() {
		this.buttonWidget = this.controller.get('post-send-button');
		this.buttonWidget.mojo.deactivate();
	}
	
	
	
});






/*
	Small controller class used for the update location account dialog
*/
var LocationDialogAssistant = Class.create({
	
	initialize: function(sceneAssistant) {
		this.sceneAssistant = sceneAssistant;
		this.controller = sceneAssistant.controller;
	},
	
	setup : function(widget) {
		this.widget = widget;
		
		/*
			update button
		*/
		this.updateButtonAttributes = {
			type: Mojo.Widget.activityButton
		};
		this.updateButtonModel = {
			buttonLabel : "Update Location",
			buttonClass: 'primary'
		};
		this.controller.setupWidget('update-location-button', this.updateButtonAttributes, this.updateButtonModel);
		


		/*
			get location button
		*/
		this.getLocationButtonAttributes = {
			type: Mojo.Widget.activityButton
		};
		this.getLocationButtonModel = {
			buttonLabel : "Get Location",
			buttonClass: 'secondary'
		};
		this.controller.setupWidget('get-location-button', this.getLocationButtonAttributes, this.getLocationButtonModel);
		
		

		
		/*
			location text field
		*/
		this.locationBoxAttr = {
			"hintText":	      'Enter new location',
			"focusMode":      Mojo.Widget.focusSelectMode,
			"fieldName": 	  'update-location-textfield',
			"changeOnKeyPress": true,
			"maxLength":      30,
			"autoReplace":    false
		};
		this.locationBoxModel = {
			'value':     '',
			'disabled':  false
		}
		this.controller.setupWidget('update-location-textfield', this.locationBoxAttr, this.locationBoxModel);
		
		
	},
	
	activate: function() {
		var thisA = this;
		Mojo.Event.listen($('update-location-button'), Mojo.Event.tap, this.updateLocation.bind(this));
		Mojo.Event.listen($('get-location-button'), Mojo.Event.tap, this.getLocation.bind(this));
	},
	
	deactivate: function() {
		var thisA = this;
		Mojo.Event.stopListening($('update-location-button'), Mojo.Event.tap, this.updateLocation.bind(this));
		Mojo.Event.stopListening($('get-location-button'), Mojo.Event.tap, this.getLocation.bind(this));
	},
	
	getLocation: function() {
	
		var thisA = this;

		var on_success = function(data) { // onsuccess
			dump(data);
			var lat_str = data.latitude.toPrecision(10).toString();
			var lon_str = data.longitude.toPrecision(10).toString();
			thisA.locationBoxModel.value = lat_str + ',' + lon_str;
			thisA.controller.modelChanged(thisA.locationBoxModel);
			thisA.controller.get('get-location-button').mojo.deactivate();
		};
		var on_error = function(data) { // onerror
			dump(data);
			thisA.controller.get('get-location-button').mojo.deactivate();
			jQuery('#location-popup-error').html($L('Could not get current location. You may need to accept terms and conditions in <strong>Location Services</strong>'));
		};
		
		var loc = new Mojo.Service.Request('palm://com.palm.location', {
				method:"getCurrentPosition",
				parameters:{
					'accuracy':     1,
					'responseTime': 1,
					'maximumAge':  60 // seconds
				},
				'onSuccess':on_success,
				'onFailure':on_error
			}
		);
	},
	
	updateLocation: function() {
		var thisA = this;
		
		jQuery().bind('update_location_succeeded', function() {
			thisA.controller.get('update-location-button').mojo.deactivate();
			jQuery('#location-popup-message').html($L('Location updated on Twitter'));
			thisA.widget.mojo.close();
		});
		jQuery().bind('update_location_failed', function() {
			thisA.controller.get('update-location-button').mojo.deactivate();
			jQuery('#location-popup-error').html($L('Updating location on Twitter failed or timed-out'));
		});
		
		this.sceneAssistant.twit.updateLocation(this.locationBoxModel.value);
	}
	
});