// ==UserScript==
// @name          Planets.nu - Enemy Ship List Plugin
// @namespace     kedalion/enemyShipList
// @version       1.40
// @date          2026-10-18
// @author        kedalion and sphere300
// @description   NU dashboard plugin which tracks and lists all ships ever seen. The plugin automatically updates the list and let's you gather information on the enemy fleet.
// @include       http://planets.nu/*
// @include       http://play.planets.nu/*
// @include       http://test.planets.nu/*
// @include       https://mobile.planets.nu/*
// @include       https://planets.nu/*
// @resource      userscript https://github.com/sphere300/PlanetsNuEnemyShipListPlugin
// @homepage      http://planets.nu/discussion/utility-script-enemy-ship-list-plugin

// ==/UserScript==

/*
Change log:
1.40   Added a new feature to see the historical movement of enemy ships. You can filter by all, by player, or by ship. You can show the path range for specific time windows and fixed one issue with the origonal plugins icon
1.39   Updated include for new URL [2018-12-22]
1.38   Updated to recent changes in mobile client [2018-12-22]
1.37   Fixed check for mobile client to use version number [2018-12-15]
1.36   Started adaptation for new mobile client version. [2018-10-24]
1.35   Adapted showInfo function to always call the original client function and then modify the result. This will prevent overwriting info from future changes (such as wormhole info). [2017-10-31]
1.34   Added support for games with accelerated start [2015-05-06]
1.33   Added support for the sphere addon [2014-12-25]
1.32   Fixed a small bug with unowned ships [2014-12-10]
1.31   Fixed a bug with shared intel [2014-11-21]
1.3    Added support for soft ship limit (PP games) [2014-11-19]
1.21   Added hover text for the starmap (code by 'hugh42', Thanks!) [2014-10-24]
1.20   Moved from monkeyguts.com to greasyfork.org [2014-10-24]
1.19   Allow for ship limits other than 500 [2014-07-07]
1.18   Moved from userscripts.org to monkeyguts.com [2014-05-30]
1.17   Colored map tools entry. [2014-04-26]
1.16   Fixed game names not showing up in 'storage stats' [2014-03-19]
1.15   Storage stats now include more game details. [2014-02-20]
1.13   In case of insufficient memory, a popup will alert the user, but play will not be interrupted [2014-02-20]
1.12   Added a storage tab which allows to clear plugin data for all or individual games from browser storage [2014-02-20]
1.11   Plugin is disabled by default to prevent all games from creating entries in browser storage [2014-02-19]
1.10   Fixed bug such that capitalships without weapons are recognized as freigthers [2014-02-03]
1.09   Added screen clearing on 'x' [2014-02-03]
1.08   Added display functionality for enemey ship locations on the starmap [2014-02-03]
1.07   Fixed a bug which blocked 'Other players' tab. Tab selection persistent after exit. [2014-01-26]
1.06   Added VCR (no ALLY VCRs) and combat message support [2014-01-25]
1.05   Added 'intel summary' panel [2014-01-12]
1.04   Fixed minor things. [2013-08-05]
1.03   Added damage and crew to ship properties. Added code to prevent list reset when rebuild fails on time machine load error. [2013-08-04]
1.02   Fixed a bug which carrier data over into other games [2013-07-15]
1.01   Fixed the include paths [2013-07-14]
1.0    Release first full version [2013-07-14]
0.9    Initial beta release [2013-07-10]
*/
function wrapper() { // wrapper for injection

	if (vgap.version < 3.0) {
		console.log("EnemyShipList plugin requires at least NU version 3.0. Plugin disabled.");
		return;
	}

	var plugin_version = 1.39;

	//dashboard icon: black tile with a red ship, inlined so no external image is needed
	var enemy_ships_icon = "data:image/svg+xml," + encodeURIComponent(
		"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512' width='90' height='90'>" +
		"<defs>" +
		"<filter id='s' x='-20%' y='-20%' width='140%' height='150%'><feGaussianBlur in='SourceAlpha' stdDeviation='8'/><feOffset dy='10'/><feComponentTransfer><feFuncA type='linear' slope='.35'/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in='SourceGraphic'/></feMerge></filter>" +
		"<linearGradient id='t' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#3a3a3a'/><stop offset='.12' stop-color='#1a1a1a'/><stop offset='1' stop-color='#000'/></linearGradient>" +
		"<linearGradient id='a' x1='0' y1='0' x2='1' y2='0'><stop offset='0' stop-color='#fff' stop-opacity='0'/><stop offset='.5' stop-color='#fff' stop-opacity='.85'/><stop offset='1' stop-color='#fff' stop-opacity='0'/></linearGradient>" +
		"</defs>" +
		"<rect x='80' y='72' width='352' height='340' rx='46' fill='url(#t)' filter='url(#s)'/>" +
		"<g fill='#e00000'>" +
		"<ellipse cx='175' cy='187' rx='48' ry='10'/>" +
		"<ellipse cx='177' cy='178' rx='14' ry='6'/>" +
		"<polygon points='196,192 212,192 232,216 214,216'/>" +
		"<rect x='198' y='212' width='94' height='20' rx='10'/>" +
		"<polygon points='280,216 292,216 302,168 290,168'/>" +
		"<path d='M280,158H385V171H280A6.5,6.5 0 0 1 280,158Z'/>" +
		"</g>" +
		"<path d='M143,328Q255,280 368,328' fill='none' stroke='url(#a)' stroke-width='2.5' stroke-linecap='round'/>" +
		"</svg>");

	console.log("EnemyShipList plugin version: v" + plugin_version);

	function ShipMin() {
		//selected fields from NU ship objects
		this.id = 0;
		this.name = "";
		this.ownerid = 0;
		this.hullid = 0;
		this.mass = 0;
		this.x = 0;
		this.y = 0;
		this.engineid = 0;
		this.warp = 0;
		this.beamid = 0;
		this.beams = 0;
		this.torpedoid = 0;
		this.torps = 0;
		this.ammo = 0;
		this.damage = 0;
		this.crew = 0;
		this.neutronium = 0;

		//extra value
		this.infoturn = 1;
		this.visible = false;
		this.history = {};
	};


	/**
	 *  Specify your plugin
	 *  You need to have all those methods defined or errors will be thrown.
	 *  I inserted the print-outs in order to demonstrate when each method is
	 *  being called. Just comment them out once you know your way around.
	 *
	 *  For any access to plugin class variables and methods,
	 *  "vgap.plugins["enemyShipListPlugin"].my_variable" has to be used
	 *  instead of "this.my_variable".
	 */
	var enemyShipListPlugin =
	{

		/**
		 * processload: executed whenever a turn is loaded: either the current turn or
		 * an older turn through time machine
		 */
		processload: function () {
			//console.log("ProcessLoad: plugin called.");

			//use game id and player slot to construct correct path to local storage
			vgap.plugins["enemyShipListPlugin"].storage_path = vgap.plugins["enemyShipListPlugin"].plugin_name + "." + vgap.gameId + "." + vgap.player.id + ".";

			//handle reset requests
			if (vgap.plugins["enemyShipListPlugin"].resetRequest) {
				vgap.plugins["enemyShipListPlugin"].resetRequest = false;

				vgap.plugins["enemyShipListPlugin"].enemyShipList = [];

				//set turn variable to allow list read in
				vgap.plugins["enemyShipListPlugin"].firstListTurn = vgap.game.turn;
				vgap.plugins["enemyShipListPlugin"].currentListTurn = vgap.game.turn - 1;

				//save the emptied list to local storage or it will just be reloaded
				//					this.saveEnemyShipList();


			} else {

				//try to load data from local storage
				vgap.plugins["enemyShipListPlugin"].loadEnemyShipList();

			}

			vgap.plugins["enemyShipListPlugin"].mobile_version = vgap.plugins["enemyShipListPlugin"].checkIfMobileVersion();
			//update enemy ship list from loaded data
			vgap.plugins["enemyShipListPlugin"].updateEnemyShipList();

		},

		showEnemyShipFilter: function () {
			if (vgap.plugins["enemyShipListPlugin"].menuactive) {
				$("#EnemyShipTool").remove();
				vgap.plugins["enemyShipListPlugin"].menuactive = false;
			}
			else {
				vgap.plugins["enemyShipListPlugin"].showSelectionTool();
				vgap.plugins["enemyShipListPlugin"].menuactive = true;
			}
		},

		/**
		 * loaddashboard: executed to rebuild the dashboard content after a turn is loaded
		 */
		loaddashboard: function () {
			//console.log("LoadDashboard: plugin called.");

			//add Link to Enemy Ship List to left Dashboard menu
			var menu = document.getElementById("DashboardMenu").childNodes[2]; //insert after starships
			//var menu = $("<ul></ul>").appendTo("#DashboardMenu");	//append to end in new section
			//" + vgap.plugins["enemyShipListPlugin"].enemyShipList.length + "
			$("<li style=\"color:#FF0000\">Alien Ships »</li>").tclick(function () { vgap.plugins["enemyShipListPlugin"].showEnemyShips(); }).appendTo(menu);
			this.showEnemyShipFilter();
		},

		/**
		 * showdashboard: executed when switching from starmap to dashboard
		 */
		showdashboard: function () {
			//console.log("ShowDashboard: plugin called.");
		},

		/**
		 * showsummary: executed when returning to the main screen of the dashboard
		 */
		showsummary: function () {
			//console.log("ShowSummary: plugin called.");

			//insert Icon for Enemy Starship List on Home Screen
			vgap.plugins["enemyShipListPlugin"].view = 6;

			var node;
			var summary_list;

			if (vgap.plugins["enemyShipListPlugin"].mobile_version) {
				// console.log("ShowSummary for mobile ");
				var summary_list = document.getElementById("TurnSummary");
				node = document.createElement("span");
			}
			else {
				// console.log("ShowSummary for non-mobile");
				var summary_list = document.getElementById("TurnSummary").childNodes[0];
				node = document.createElement("li");
			}

			node.setAttribute("style", "color:#FF0000"); //#FF8000 //#DF0101");
			node.innerHTML = "<div class=\"iconholder\"><img width=\"90\" height=\"90\" src=\"" + enemy_ships_icon + "\"/></div>" +
				(vgap.plugins["enemyShipListPlugin"].numEnemyShips + vgap.plugins["enemyShipListPlugin"].numAlliedShips) +
				" Alien Starships";
			node.onclick = function () { vgap.plugins["enemyShipListPlugin"].showEnemyShips(); };

			var starbase_entry = summary_list.children[4];
			summary_list.insertBefore(node, starbase_entry);
		},

		/**
		 * loadmap: executed after the first turn has been loaded to create the map
		 * as far as I can tell not executed again when using time machine
		 */
		loadmap: function () {
			//console.log("LoadMap: plugin called.");
			if (!vgap.plugins["enemyShipListPlugin"].mobile_version) {
				vgap.map.addMapTool("<span style=\"color:#FF0000\">Enemy Ships</span>", "ShowMinerals", vgap.plugins["enemyShipListPlugin"].showOverlayFilter);

			} else {
				// vgap.map.addMapTool("Enemy Ships", "fa-space-shuttle redcolor", function () {vgap.plugins["enemyShipListPlugin"].showSelectionTool(); });
				vgap.map.addMapTool("Enemy Ships", "enemyshipmenu redcolor", function () { vgap.plugins["enemyShipListPlugin"].toggleSelectionTool(); });



				var head = document.getElementsByTagName('head')[0];
				if (head) {
					var newCss = document.createElement('style');
					newCss.type = "text/css";
					newCss.innerHTML = ".redcolor::before {color: #FF0000}";
					newCss.innerHTML += ".activeColor::before {color: #00FF00}";
					head.appendChild(newCss);
				}
				if (head) {
					var num_slots = vgap.plugins["enemyShipListPlugin"].drawSelection.length + 1;
					var slot_width = 40;
					var width = $(window).width() - 100;
					for (var i = 1; i < 5; i++) {
						if ((num_slots / i) * slot_width < width) {
							width = num_slots / i * slot_width;
							break;
						}
					}



					var newCss = document.createElement('style');
					newCss.type = "text/css";
					newCss.innerHTML = "#EnemyShipTool {" +
						"position: absolute; " +
						"right: 40px; " +
						"z-index: 9;" +
						"top: 0px;" +
						"width: " + width + "px;" +
						"height: 70px;" +
						"}" +
						"#EnemyShipTool .mapbutton {" +
						"position: relative;" +
						"margin-left: 10px;" +
						"margin-bottom: 10px;" +
						"float:right;" +
						"}";
					newCss.innerHTML += ".enemyshipfilter::before { content: \"\\f002\";}";
					newCss.innerHTML += ".enemymenuhide::before { content: \"\\f105\";}";
					newCss.innerHTML += ".allships::before { content: 'All'; color: #FFFFFF}";
					newCss.innerHTML += ".allshipsenabled::before { content: 'All'; color: #FFFF00}";
					for (var i = 1; i < vgap.plugins["enemyShipListPlugin"].drawSelection.length; i++) {
						newCss.innerHTML += ".race" + i + "::before { content: '" + i + "'; color: #FFFFFF }";
						newCss.innerHTML += ".race" + i + "enabled::before { content: '" + i + "'; color: " + vgap.plugins["enemyShipListPlugin"].colorsA[i] + "}";
						//selected players get an outline in their colour, since allied/enemy numbers keep their relation colour
						newCss.innerHTML += "#EnemyShipTool .race" + i + "enabled { box-shadow: inset 0 0 0 2px " + vgap.plugins["enemyShipListPlugin"].colorsA[i] + "}";
					}
					//relation colours for the player numbers
					newCss.innerHTML += "#EnemyShipTool .relally::before { color: #00FF00 !important }";
					newCss.innerHTML += "#EnemyShipTool .relenemy::before { color: #FF0000 !important }";
					newCss.innerHTML += "#EnemyShipTool .relself::before { color: #FFFF00 !important }";
					//dead players get the round button filled with a cross hatch pattern; drawn as the button's own background so it is clipped to the button's circle
					newCss.innerHTML += "#EnemyShipTool .mapbutton.playerdead { background-image: " +
						"repeating-linear-gradient(45deg, rgba(255,0,0,0.6) 0, rgba(255,0,0,0.6) 1px, transparent 1px, transparent 5px)," +
						" repeating-linear-gradient(-45deg, rgba(255,0,0,0.6) 0, rgba(255,0,0,0.6) 1px, transparent 1px, transparent 5px) !important; }";
					newCss.innerHTML += ".enemyshipmenu::before { content: \"\\f197\"}";

					head.appendChild(newCss);
				}
			}
		},

		/**
		 * showmap: executed when switching from dashboard to starmap
		 */
		showmap: function () {
			//console.log("ShowMap: plugin called.");
		},

		/**
		 * draw: executed on any click or drag on the starmap
		 */
		draw: function () {
			//console.log("Draw: plugin called.");
			vgap.plugins["enemyShipListPlugin"].drawEnemyShips();
		},

		/**
		 * loadplanet: executed a planet is selected on dashboard or starmap
		 */
		loadplanet: function () {
			//console.log("LoadPlanet: plugin called.");
		},

		/**
		 * loadstarbase: executed a planet is selected on dashboard or starmap
		 */
		loadstarbase: function () {
			//console.log("LoadStarbase: plugin called.");
		},

		/**
		 * loadship: executed a planet is selected on dashboard or starmap
		 */
		loadship: function () {
			//console.log("LoadShip: plugin called.");
		},

		/***************************************************************************************
		 * Custom plugin variables
		 ***************************************************************************************/

		//things that get saved to disk
		enemyShipList: [],
		currentListTurn: 0,
		firstListTurn: 0,
		version: plugin_version,
		player_name: "",
		game_name: "",
		race_name: "",
		storage_path: "EnemyShipListPlugin.",
		mobile_version: false,
		menuactive: false,

		//other variables
		plugin_name: "EnemyShipListPlugin",
		enabled: false,
		processAllTurns: false,
		resetRequest: false,
		playerFilterId: 1,
		includeUnknown: false,
		enableEdit: false,
		numEnemyShips: 0,
		numAlliedShips: 0,
		view: 6,
		drawSelection: [],
		drawRadius: 3,
		historyFadeStep: 0.15,	//opacity lost per turn of age on history paths
		historyMinAlpha: 0.10,	//oldest history paths never fade below this
		max_ship_id: 0,
		shipFilterId: 0,
		showShipFilter: false,
		turnFrom: null,	//null = default: last defaultTurnSpan turns
		defaultTurnSpan: 15,
		turnTo: 0,		//0 = current turn

		colorsA: ["#F0F8FF", "#32CD32", "#CD5C5C", "#FFC0CB", "#98FB98", "#C0C0C0", "#FFFF00", "#EE82EE", "#D3D3D3", "#B0E0E6", "#87CEFA", "#7B68EE", "#F4A460", "#D2B48C", "#FF6347", "#F5DEB3", "#F08080", "#2F4F4F", "#008080", "#B22222", "#808000", "#9370DB", "#00FF00", "#4B0082", "#D2B48C", "#9ACD32", "#DAA520", "#F0F8FF", "#6B8E23", "#FF4500"],
		//


		//original processLoad method
		oldProcessLoadHistory: null,

		/***************************************************************************************
		 * Custom plugin methods
		 ***************************************************************************************/

		enablePlugin: function () {

			try {
				localStorage.setItem(this.storage_path + "version", this.version);
			} catch (err) {
				var msg = "The available localStorage space of your browser is too small to save the plugin data. Please use the 'Storage Stats' tab in the EnemyShipListPlugin to free some space.";
				alert(msg);
			}

			this.enabled = true;
		},

		initializeDefaults: function () {
			this.enemyShipList = [];
			this.firstListTurn = vgap.game.turn;
			this.currentListTurn = vgap.game.turn - 1;
			this.player_name = vgap.player.username;
			this.game_name = vgap.game.name;
			this.race_name = (vgap.getRace(vgap.player.raceid)).shortname;
			this.max_ship_id = vgap.settings.shiplimit;


			this.numAlliedShips = 0;
			this.numEnemyShips = 0;
			this.playerFilterId = 1;
			this.includeUnknown = false;
			this.enableEdit = false;
			this.view = 6;



			for (var p = 0; p <= vgap.players.length; p++) {
				this.drawSelection[p] = false;
			}
		},


		/**
		* Determine if new client version (> 4.0 aka mobile version) is running
		*/
		checkIfMobileVersion: function () {

			url = window.location.href;
			if (vgap.version >= 4.0) {
				console.log("Mobile client code detected...");
				return true;
			} else {
				console.log("Non-mobile client code detected...");
				return false;
			}
		},


		/**
		 * Load current list of enemy ships from local data on browser cache or initialize empty list
		 */
		loadEnemyShipList: function () {

			var stored_version = localStorage.getItem(this.storage_path + "version");
			var stored_list = localStorage.getItem(this.storage_path + "shiplist");
			var stored_turn = localStorage.getItem(this.storage_path + "turn");
			var first_turn = localStorage.getItem(this.storage_path + "firstturn");
			//				var stored_game_name   	= localStorage.getItem(this.storage_path + "game_name");
			//				var stored_player_name 	= localStorage.getItem(this.storage_path + "player");
			//				var stored_race_name   	= localStorage.getItem(this.storage_path + "race");

			this.player_name = vgap.player.username;
			this.game_name = vgap.game.name;
			this.race_name = (vgap.getRace(vgap.player.raceid)).shortname;


			for (var p = 0; p <= vgap.players.length; p++) {
				this.drawSelection[p] = false;
			}

			//if plugin is not enabled for this game/player then exit
			if (stored_version != null) {
				this.enabled = true;

				if (stored_version != null && stored_list != null && stored_turn != null && first_turn != null) {

					//parse the data loaded from localstorage
					this.enemyShipList = JSON.parse(stored_list);
					this.currentListTurn = parseInt(stored_turn);
					this.firstListTurn = parseInt(first_turn);

					if (stored_version != this.version) {
						console.log("EnemyShipListPlugin: Warning: version mismatch addon (" + this.version + ") and local data (" + stored_version + ")!");

						if (stored_version < 1.03) {
							//upgrade missing properties with default values
							for (var i = 0; i < this.enemyShipList.length; i++) {
								this.enemyShipList[i].neutronium = 0;
								this.enemyShipList[i].damage = -1;
								this.enemyShipList[i].crew = -1;
							}
						}
						if (stored_version < 1.15) {
							this.player_name = vgap.player.username;
							this.game_name = vgap.game.name;
							this.race_name = (vgap.getRace(vgap.player.raceid)).shortname;
						}
						if (stored_version < 1.21) {
							this.updateEnemyShipList();
						}

						this.saveEnemyShipList();

						//put possible version upgrade here
					}
					this.updateShipCounts();

					//this.enabled = true;

					return true;
				}
			} else {
				this.enabled = false;
			}


			//				console.log("EnemyShipListPlugin: No previous data found for enemy ship list. User needs to enable plugin for current game/player combination.");
			console.log("EnemyShipListPlugin: No previous data found for enemy ship list. Creating data structures.");

			this.initializeDefaults();

			return false;
		},

		/**
		 * Save current list of enemy ships to local data on browser cache
		 */
		saveEnemyShipList: function () {

			if (!this.enabled) {
				return;
			}

			this.updateShipCounts();

			var stored_version = localStorage.getItem(this.storage_path + "version");
			var stored_list = localStorage.getItem(this.storage_path + "shiplist");
			var stored_turn = localStorage.getItem(this.storage_path + "turn");
			var first_turn = localStorage.getItem(this.storage_path + "firstturn");
			var stored_player = localStorage.getItem(this.storage_path + "player");

			try {
				localStorage.setItem(this.storage_path + "version", this.version);
				localStorage.setItem(this.storage_path + "shiplist", JSON.stringify(this.enemyShipList));
				localStorage.setItem(this.storage_path + "turn", this.currentListTurn);
				localStorage.setItem(this.storage_path + "firstturn", this.firstListTurn);

				localStorage.setItem(this.storage_path + "game_name", this.game_name);
				localStorage.setItem(this.storage_path + "player", this.player_name);
				localStorage.setItem(this.storage_path + "race", this.race_name);

			} catch (err) {

				//restore original values
				if (stored_version != null) {
					localStorage.setItem(this.storage_path + "version", stored_version);
				}
				if (stored_list != null) {
					localStorage.setItem(this.storage_path + "shiplist", stored_list);
					this.enemyShipList = stored_list;
				}
				if (stored_turn != null) {
					localStorage.setItem(this.storage_path + "turn", stored_turn);
					this.currentListTurn = stored_turn;
				}
				if (first_turn != null) {
					localStorage.setItem(this.storage_path + "firstturn", first_turn);
					this.firstListTurn = first_turn;
				}
				if (stored_player != null) {
					localStorage.setItem(this.storage_path + "player", stored_player);
					this.player_name = stored_player;
				}

				//show error message
				var msg = "The available space in the localStorage of your browser is too small to save the plugin data! \n\nPlease use the 'Storage Stats' tab in the EnemyShipListPlugin to free some space.";

				//abort potential rebuild in progress
				if (vgap.plugins["enemyShipListPlugin"].processAllTurns) {
					vgap.plugins["enemyShipListPlugin"].processAllTurns = false;
					msg += "\n \nDB rebuild aborted.";
				}

				alert(msg);
			}

		},
		/**
		 * Removes all data from local storage (in browser) for a given game id and player slot
		 * @param   game_id         id of the game to be removed
		 * @param   player_slot     slot of the player to be removed
		 */
		removeStorageEntry: function (game_id, player_slot) {
			var key_prefix = vgap.plugins["enemyShipListPlugin"].plugin_name + "." + game_id + "." + player_slot + ".";
			localStorage.removeItem(key_prefix + "version");
			localStorage.removeItem(key_prefix + "shiplist");
			localStorage.removeItem(key_prefix + "turn");
			localStorage.removeItem(key_prefix + "firstturn");
			localStorage.removeItem(key_prefix + "player");
			localStorage.removeItem(key_prefix + "race");
			localStorage.removeItem(key_prefix + "game_name");

			if (game_id == vgap.gameId && player_slot == vgap.player.id) {
				vgap.plugins["enemyShipListPlugin"].initializeDefaults();
				vgap.plugins["enemyShipListPlugin"].enabled = false;
			}
		},

		/**
		 * Remove all plugin data for all games and players from the local storage of the browser
		 */
		removeAllStorageEntries: function () {

			//setup regex filters:
			var pattern_plugin_entry = /EnemyShipListPlugin.[0-9]+.[0-9]+.version/;
			var pattern_no_version = /.[0-9]+.[0-9]+/;
			var pattern1 = /[0-9]+/;
			var pattern2 = /[0-9]+$/;

			//go through local storage and find all entries for this plugin
			for (var key in localStorage) {

				var tmp = pattern_no_version.exec(pattern_plugin_entry.exec(key));

				var match1 = pattern1.exec(tmp);
				var match2 = pattern2.exec(tmp);

				if (match1 != "" && match2 != "" && match1 != null && match2 != null) {
					var game_id = parseInt(match1, 10);
					var player_slot = parseInt(match2, 10);
					this.removeStorageEntry(game_id, player_slot);
				}
			}
		},

		/**
		 * Updates the status variables with number of allied and non allied ships
		 */
		updateShipCounts: function () {

			this.numEnemyShips = 0;
			this.numAlliedShips = 0;
			this.max_ship_id = vgap.settings.shiplimit;

			for (var es = 0; es < this.enemyShipList.length; es++) {

				//update highest ship id
				if (this.enemyShipList[es].id > this.max_ship_id) {
					this.max_ship_id = this.enemyShipList[es].id;
				}

				//ignore own ships
				if (this.enemyShipList[es].ownerid == vgap.player.id)
					continue;

				if (vgap.alliedTo(this.enemyShipList[es].ownerid)) {
					this.numAlliedShips++;
				} else {
					this.numEnemyShips++;
				}
			}
		},

		/**
		 * Update the ship list with data from current turn if appropriate
		 */
		updateEnemyShipList: function () {

			console.log("Update called...");

			if (!this.enabled) {
				return;
			}

			if (vgap.game.turn <= this.currentListTurn) {
				console.log("EnemyShipListPlugin: Turn before latest integrated data: ignored.");
				return;
			}

			if (vgap.game.turn != (this.currentListTurn + 1)) {
				console.log("EnemyShipListPlugin: Current turn is " + vgap.game.turn + ".");
				console.log("EnemyShipListPlugin: Next turn for correct update required: " + (this.currentListTurn + 1) + ".");
				return;
			}

			console.log("Update going.");

			//first process all VCRs
			for (var i = 0; i < vgap.vcrs.length; i++) {
				var ship = null;

				if (vgap.vcrs[i].leftownerid != vgap.player.id && vgap.vcrs[i].rightownerid != vgap.player.id) {
					continue;
				}

				for (side = 0; side < 2; side++) {
					if (side == 0) {
						ship = vgap.vcrs[i].left;
						ship.ownerid = vgap.vcrs[i].leftownerid;
						ship.x = vgap.vcrs[i].x;
						ship.y = vgap.vcrs[i].y;
					}
					else {
						if (vgap.vcrs[i].battletype == 1) {
							//skip right ship for planet fights
							continue;
						}
						ship = vgap.vcrs[i].right;
						ship.ownerid = vgap.vcrs[i].rightownerid;
						ship.x = vgap.vcrs[i].x;
						ship.y = vgap.vcrs[i].y;
					}

					oldShipHistory = null;
					//loop through list of enemy ships and delete ship with same id
					for (var es = 0; es < this.enemyShipList.length; es++) {
						if (this.enemyShipList[es].id == ship.objectid) {
							//remove ship
							deletedData = this.enemyShipList.splice(es, 1);
							if (deletedData && deletedData.length > 0) {
								oldShipHistory = deletedData[0].history;
							}
							break;
						}
					}
					//add new enemy ship to list
					var n = new ShipMin();
					n.id = ship.objectid;
					n.name = ship.name;
					n.ownerid = ship.ownerid;
					n.hullid = ship.hullid;
					n.mass = ship.mass;
					n.x = ship.x;
					n.y = ship.y;
					n.warp = 0;
					n.engineid = 0;
					n.beamid = ship.beamid;
					n.beams = ship.beamcount;
					n.torpedoid = ship.torpedoid;
					n.torps = ship.launchercount;
					if (ship.baycount > 0) {
						n.ammo = ship.fighters;
					} else {
						n.ammo = ship.torpedos;
					}
					n.infoturn = vgap.game.turn;
					n.damage = ship.damage;
					n.crew = ship.crew;
					n.neutronium = 0;

					if (oldShipHistory) {
						n.history = oldShipHistory;
					}

					if (!n.history[vgap.game.turn]) {
						n.history[vgap.game.turn] = {}
						n.history[vgap.game.turn]['x'] = ship.x;
						n.history[vgap.game.turn]['y'] = ship.y;
					}
					//this.enemyShipList.push(vgap.ships[i]);
					this.enemyShipList.push(n);

				}
			}


			//process all combat messages

			for (var i = 0; i < vgap.messages.length; i++) {
				//check if a ship was destroyed
				if (vgap.messages[i].messagetype == 6) {
					//check if own ship has destroyed another
					pattern = /destroyed the .* ship .* ID#[0-9]*/;
					pattern2 = /[0-9]*$/;
					match = pattern2.exec(pattern.exec(vgap.messages[i].body));

					if (match != "") {
						shipID = parseInt(match, 10);
						// loop through list of enemy ships and delete ship with same id
						for (var es = 0; es < this.enemyShipList.length; es++) {
							if (this.enemyShipList[es].id == shipID) {
								// remove ship
								this.enemyShipList.splice(es, 1);
								break;
							}
						}
						continue;
					}

					//check if own ship has been destroyed
					pattern = /ID#[0-9]* has been destroyed/;
					pattern2 = /[0-9]+/g;
					match = pattern2.exec(pattern.exec(vgap.messages[i].body));

					if (match != "") {
						shipID = parseInt(match, 10);
						// loop through list of enemy ships and delete ship with same id
						for (var es = 0; es < this.enemyShipList.length; es++) {
							if (this.enemyShipList[es].id == shipID) {
								// remove ship
								this.enemyShipList.splice(es, 1);
								break;
							}
						}
					}
				}
			}

			//remove all own and allied ships (they will get readded up to date)
			//and mark all other ships invisible
			//				console.log("Num ships: " + this.enemyShipList.length);
			for (var es = this.enemyShipList.length - 1; es >= 0; es--) {
				var ownerid = this.enemyShipList[es].ownerid;

				//                    console.log(es + ": owner: " + ownerid);
				var relation = vgap.getRelation(ownerid);

				if (ownerid == vgap.player.id || vgap.fullallied(ownerid) || (relation != null && relation.relationfrom >= 3)) {
					//                        console.log("delete");
					// remove ship
					this.enemyShipList.splice(es, 1);
				}
				else {
					this.enemyShipList[es].visible = false;
				}
			}



			//process all ships
			for (var i = 0; i < vgap.ships.length; i++) {

				//support for sphere addon
				if (vgap.ships[i].id < 0) {
					continue;
				}

				oldShipHistory = null;
				//loop through list of enemy ships and delete ship with same id
				for (var es = 0; es < this.enemyShipList.length; es++) {
					if (this.enemyShipList[es].id == vgap.ships[i].id) {
						//remove ship
						deletedData = this.enemyShipList.splice(es, 1);
						if (deletedData && deletedData.length > 0) {
							oldShipHistory = deletedData[0].history;
						}
						break;
					}
				}
				//if the current ship is one of your own, don't do anything
				//					if (vgap.ships[i].ownerid == vgap.player.id) {
				//						continue;
				//					}
				//add new enemy ship to list
				var n = new ShipMin();
				n.id = vgap.ships[i].id;
				n.name = vgap.ships[i].name;
				n.ownerid = vgap.ships[i].ownerid;
				n.hullid = vgap.ships[i].hullid;
				n.mass = vgap.ships[i].mass;
				n.x = vgap.ships[i].x;
				n.y = vgap.ships[i].y;
				n.warp = vgap.ships[i].warp;
				n.engineid = vgap.ships[i].engineid;
				n.beamid = vgap.ships[i].beamid;
				n.beams = vgap.ships[i].beams;
				n.torpedoid = vgap.ships[i].torpedoid;
				n.torps = vgap.ships[i].torps;
				n.ammo = vgap.ships[i].ammo;
				n.infoturn = vgap.ships[i].infoturn; //vgap.game.turn;
				n.visible = true;
				n.damage = vgap.ships[i].damage;
				n.crew = vgap.ships[i].crew;
				n.neutronium = vgap.ships[i].neutronium;
				if (oldShipHistory) {
					n.history = oldShipHistory;
				}

				if (!n.history[vgap.game.turn]) {
					n.history[vgap.game.turn] = {}
					n.history[vgap.game.turn]['x'] = vgap.ships[i].x;
					n.history[vgap.game.turn]['y'] = vgap.ships[i].y;
				}
				//this.enemyShipList.push(vgap.ships[i]);
				this.enemyShipList.push(n);
				//console.log(i + ": add id: " + vgap.ships[i].id + " length: " + this.enemyShipList.length);
			}

			/*			this.max_ship_id = vgap.settings.shiplimit;
						//loop through list of enemy ships and determine max_ship_id
						for (var es=0; es<this.enemyShipList.length; es++) {
							if (this.enemyShipList[es].id > this.max_ship_id) {
							   this.max_ship_id = this.enemyShipList[es].id;
							}
						}
			*/
			this.enemyShipList.sort(function (a, b) { return (a.id - b.id); });

			this.currentListTurn = vgap.game.turn;

			this.saveEnemyShipList();

		},

		/**
		 * Reset enemy ship list and restart recording from current turn
		 */
		resetEnemyShipList: function () {

			//delete current list content
			this.enemyShipList = [];

			//set turn variable to allow list read in
			this.firstListTurn = vgap.game.turn;
			this.currentListTurn = vgap.game.turn - 1;

			this.updateEnemyShipList();

			//refresh the dashboard
			vgap.showDashboard();

		},

		/**
		 * Reset enemy ship list and restart recording from current turn
		 * It will automatically load all turn till 'NOW'.
		 */
		rebuildListFromTurn: function (turn) {

			console.log("EnemyShipListPlugin: Rebuilding enemy ship list starting from turn " + turn);

			if (turn == null) {
				turn = vgap.game.turn;
			}

			if (turn > vgap.nowTurn || turn < 1) {
				return;
			}

			this.resetRequest = true;


			//				this.enemyShipList = [];
			//
			//
			//				//set turn variable to allow list read in
			//				this.firstListTurn = turn;
			//				this.currentListTurn = turn - 1;
			//
			//				//save the emptied list to local storage or it will just be reloaded
			//				this.saveEnemyShipList();
			//
			this.startUpdate(turn);

		},

		/**
		 *
		 */
		startUpdate: function (turn) {
			this.processAllTurns = true;

			//console.log("startUpdate with turn: " + turn);

			if (turn == null) {
				turn = this.currentListTurn + 1;
			}


			if (turn < 1 || turn > vgap.nowTurn) {
				return;
			}

			if (turn != vgap.nowTurn) {
				vgap.loadHistory(turn);
			} else {
				vgap.loadNow();
			}

		},

		/**
		 * Delete a ship from the ship list.
		 * @param id	id of ship to remove
		 */
		removeShip: function (id) {
			for (var es = 0; es < this.enemyShipList.length; es++) {
				if (this.enemyShipList[es].id == id) {
					//remove ship
					this.enemyShipList.splice(es, 1);
					break;
				}
			}
			//save the result
			this.saveEnemyShipList();
		},

		/**
		 * Add a ship to the ship list
		 * @param ship  		object of type MinShip
		 * @param overwrite		boolean if existing entries should be overwritten
		 * @return 				success (false if ID exists already)
		 */
		addShip: function (ship, overwrite) {

			//check if ship with id already exists
			for (var es = 0; es < this.enemyShipList.length; es++) {
				if (this.enemyShipList[es].id == ship.id) {
					if (overwrite) {
						//remove ship
						this.enemyShipList.splice(es, 1);
						break;
					} else {
						return false;
					}
				}
			}

			//add ship to list
			this.enemyShipList.push(ship);

			//sort list
			this.enemyShipList.sort(function (a, b) { return (a.id - b.id); });

			//save the result
			this.saveEnemyShipList();

			return true;
		},

		/**
		 * Generate the content for the enemy ship dashboard tab
		 * @param view
		 */
		showEnemyShipsView: function (view) {
			vgap.plugins["enemyShipListPlugin"].view = view;
			vgap.plugins["enemyShipListPlugin"].showEnemyShips();
		},

		/**
		 * Generate the content for the enemy ship dashboard tab
		 * @param view
		 */
		loadShipHistoryFilter: function () {
			var html = "";
			html += '<div>Ship ID: <input type="text" id="FilterShipID"></div>';
			html += '<div id="FilterShipHistoryFilterButton">Filter</div>';
			html += '<div id="FilterShipHistoryFilterButton">Cancel</div>';
			mainPane = document.getElementById("PlanetsContainer");
			filter = document.createElement("div");
			filter.id = "FilterShipHistoryFeature";
			filter.innerHTML = html;
		},

		/**
		 * Generate the content for the enemy ship dashboard tab
		 *
		 */
		showEnemyShips: function () {

			vgap.playSound("button");
			vgap.closeSecond();

			vgap.dash.content.empty();

			view = vgap.plugins["enemyShipListPlugin"].view;

			//make sure edit is disabled except in single player view
			if (view != 3)
				vgap.plugins["enemyShipListPlugin"].enableEdit = false;


			if (vgap.plugins["enemyShipListPlugin"].enableEdit) {
				vgap.hotkeysOn = false;
			}


			var capitalships_total = 0;
			var capitalships_in_list = 0;
			var freighters_total = 0;
			var freighters_in_list = 0;

			if (view == 3) {
				//for single player view: determine number of warships and freighters for this player
				var player = vgap.getPlayer(vgap.plugins["enemyShipListPlugin"].playerFilterId);
				capitalships_total = getNumForPlayer(player.id, "capitalships");
				freighters_total = getNumForPlayer(player.id, "freighters");

				for (var i = 0; i < vgap.plugins["enemyShipListPlugin"].enemyShipList.length; i++) {
					var ship = vgap.plugins["enemyShipListPlugin"].enemyShipList[i];

					if (ship.ownerid != player.id)
						continue;

					var hull = vgap.getHull(ship.hullid);
					if (hull.beams == 0 && hull.launchers == 0 && hull.fighterbays == 0) {
						freighters_in_list++;
					} else {
						capitalships_in_list++;
					}
				}
			}


			//filter messages
			var html = "";

			$("<style type='text/css'>#PlanetTable td,#FreighterTable td{border-bottom:solid 1px #666} </style>").appendTo(vgap.dash.content);



			// $("<style type='text/css'> .Connections::before {
			// 	font-family: 'Font Awesome 5 Brands' !important;
			//   content: '\f197';
			// } </style>").appendTo(vgap.dash.content);


			//console.log("Test me!!");


			//if (view == null)
			//	view = 6;

			var filterMenu = $("<ul class='FilterMenu'></ul>").appendTo(vgap.dash.content);
			$("<li " + (view == 6 ? "class='SelectedFilter'" : "") + ">Intel Overview</li>").tclick(function () { vgap.plugins["enemyShipListPlugin"].showEnemyShipsView(6); }).appendTo(filterMenu);
			$("<li " + (view == 4 ? "class='SelectedFilter'" : "") + ">Complete</li>").tclick(function () { vgap.plugins["enemyShipListPlugin"].showEnemyShipsView(4); }).appendTo(filterMenu);
			$("<li " + (view == 0 ? "class='SelectedFilter'" : "") + ">Other Players</li>").tclick(function () { vgap.plugins["enemyShipListPlugin"].showEnemyShipsView(0); }).appendTo(filterMenu);
			$("<li " + (view == 1 ? "class='SelectedFilter'" : "") + ">Allies</li>").tclick(function () { vgap.plugins["enemyShipListPlugin"].showEnemyShipsView(1); }).appendTo(filterMenu);
			$("<li " + (view == 2 ? "class='SelectedFilter'" : "") + ">Non-Allies</li>").tclick(function () { vgap.plugins["enemyShipListPlugin"].showEnemyShipsView(2); }).appendTo(filterMenu);
			$("<li " + (view == 3 ? "class='SelectedFilter'" : "") + ">Single Players</li>").tclick(function () { vgap.plugins["enemyShipListPlugin"].showEnemyShipsView(3); }).appendTo(filterMenu);
			$("<li " + (view == 5 ? "class='SelectedFilter'" : "") + ">Configuration</li>").tclick(function () { vgap.plugins["enemyShipListPlugin"].showEnemyShipsView(5); }).appendTo(filterMenu);
			$("<li " + (view == 7 ? "class='SelectedFilter'" : "") + ">Storage Stats</li>").tclick(function () { vgap.plugins["enemyShipListPlugin"].showEnemyShipsView(7); }).appendTo(filterMenu);


			html += "<div class='DashPane' style='height:" + ($("#DashboardContent").height() - 30) + "px;'>";

			html += "<br><table border='0' width='100%'>";


			if (view == 7) {

				html += "<table id='ConfigTable' align='left' border='0' width='100%' style='cursor:pointer;'>";

				html += "<tr><td><h1>Plugin Memory</h1></td></tr>";
				html += "<tr><td>This plugin keeps track of all ships not owned by you and stores this data in the local storage of your browser. Naturally, the capacity of this storage is limited varying from browser to browser and depends on individual settings. This page will show ALL game/player combinations that have plugin data in the local storage. (Data is NOT shared between subdomains such as mobile.planets.nu and planets.nu.) You can choose to clear <strong style='color:#FF0000'>all plugin data</strong> or <strong style='color:#FF0000'> data for individual game/player combinations</strong>. <br></td></tr>";

				html += "<tr><td><br /> </td></tr>";
				html += "<tr><td><br /> </td></tr>";


				// Header row
				html += "<tr><td><table id='ShipTable' align='left' border='0' width='100%' style='cursor:pointer;'><thead>";

				html += "<th>Game Id</th>";
				html += "<th>Name</th>";
				html += "<th>Slot</th>";
				html += "<th>Player</th>";
				html += "<th>Race</th>";
				html += "<th>#1 Turn</th>";
				html += "<th>Last Turn</th>";
				html += "<th>Memory</th>";
				html += "<th>Version</th>";
				html += "<th>Delete?</th>";


				html += "</thead><tbody id='ShipRows' align=left  >";
				html += "</tbody></table></td></tr></table><p>&nbsp;</p></div>";

				this.pane = $(html).appendTo(vgap.dash.content);



				var total_size = 0;

				//go through local storage and find all entries for this plugin
				for (var key in localStorage) {

					html = "";

					var pattern_plugin_entry = /EnemyShipListPlugin.[0-9]+.[0-9]+.version/;
					var pattern_no_version = /.[0-9]+.[0-9]+/;
					var tmp = pattern_no_version.exec(pattern_plugin_entry.exec(key));
					var pattern1 = /[0-9]+/;
					var pattern2 = /[0-9]+$/;
					var match1 = pattern1.exec(tmp);
					var match2 = pattern2.exec(tmp);

					if (match1 != "" && match2 != "" && match1 != null && match2 != null) {
						var game_id = parseInt(match1, 10);
						var player_slot = parseInt(match2, 10);

						var data_size = 0;

						var version = "?";
						var last_turn = "?";
						var first_turn = "?";
						var game_name = "?";
						var player_name = "?";
						var race_name = "?";

						var item = localStorage.getItem("EnemyShipListPlugin." + game_id + "." + player_slot + ".version");
						if (item != null) {
							version = item;
							data_size += item.length * 2; //each symbol is 2 bytes on disk
						}
						item = localStorage.getItem("EnemyShipListPlugin." + game_id + "." + player_slot + ".shiplist");
						if (item != null) {
							//	last_turn = item;
							data_size += item.length * 2; //each symbol is 2 bytes on disk
						}
						item = localStorage.getItem("EnemyShipListPlugin." + game_id + "." + player_slot + ".turn");
						if (item != null) {
							last_turn = item;
							data_size += item.length * 2; //each symbol is 2 bytes on disk
						}
						item = localStorage.getItem("EnemyShipListPlugin." + game_id + "." + player_slot + ".firstturn");
						if (item != null) {
							first_turn = item;
							data_size += item.length * 2; //each symbol is 2 bytes on disk
						}
						item = localStorage.getItem("EnemyShipListPlugin." + game_id + "." + player_slot + ".game_name");
						if (item != null) {
							game_name = item;
							data_size += item.length * 2; //each symbol is 2 bytes on disk
						}
						item = localStorage.getItem("EnemyShipListPlugin." + game_id + "." + player_slot + ".player");
						if (item != null) {
							player_name = item;
							data_size += item.length * 2; //each symbol is 2 bytes on disk
						}
						item = localStorage.getItem("EnemyShipListPlugin." + game_id + "." + player_slot + ".race");
						if (item != null) {
							race_name = item;
							data_size += item.length * 2; //each symbol is 2 bytes on disk
						}

						total_size += data_size;

						html += "<tr>";

						var bold_start = "";
						var bold_stop = "";
						var color = "#FFFFFF";

						if (game_id == vgap.gameId && player_slot == vgap.player.id) {
							bold_start = "<strong>";
							bold_stop = "</strong>";
							color = "#33CC33";
						}

						html += "<td style='color:" + color + "'>" + bold_start + game_id + bold_stop + "</td>";
						html += "<td style='color:" + color + "'>" + bold_start + game_name + bold_stop + "</td>";
						html += "<td style='color:" + color + "'>" + bold_start + player_slot + bold_stop + "</td>";
						html += "<td style='color:" + color + "'>" + bold_start + player_name + bold_stop + "</td>";
						html += "<td style='color:" + color + "'>" + bold_start + race_name + bold_stop + "</td>";
						html += "<td style='color:" + color + "'>" + bold_start + first_turn + bold_stop + "</td>";
						html += "<td style='color:" + color + "'>" + bold_start + last_turn + bold_stop + "</td>";
						html += "<td style='color:" + color + "'>" + bold_start + (data_size / 1024.0).toFixed(2) + bold_stop + " kb</td>";
						html += "<td style='color:" + color + "'>" + bold_start + version + bold_stop + "</td>";


						html += "<td><button type='button' class='TestButton' onClick='vgap.plugins[\"enemyShipListPlugin\"].removeStorageEntry(" + game_id + "," + player_slot + "); " +
							"vgap.plugins[\"enemyShipListPlugin\"].showEnemyShipsView(" + view + ");'> Delete </button></td>";
						html += "</tr>";

						$(html).appendTo("#ShipRows");
					}
				}

				html = "<tr>";

				html += "<td style='color:#FF0000'><strong>All games</strong></td>";
				html += "<td style='color:#FF0000'></td>";
				html += "<td style='color:#FF0000'><strong>All players</strong></td>";
				html += "<td style='color:#FF0000'></td>";
				html += "<td style='color:#FF0000'></td>";
				html += "<td style='color:#FF0000'></td>";
				html += "<td style='color:#FF0000'></td>";
				html += "<td style='color:#FF0000'><strong>" + (total_size / 1024.0).toFixed(2) + " kb</strong></td>";
				html += "<td style='color:#FF0000'></td>";
				html += "<td style='color:#FF0000'><button type='button' class='TestButton' onClick='vgap.plugins[\"enemyShipListPlugin\"].removeAllStorageEntries(); " +
					"vgap.plugins[\"enemyShipListPlugin\"].showEnemyShipsView(" + view + ");'><strong> Delete All</strong> </button></td>";

				html += "</tr>";

				$(html).appendTo("#ShipRows");

				//make ship table sortable
				$("#ShipTable").tablesorter();

				this.pane.jScrollPane();


				// vgap.action added for the assistant (Alex):
				vgap.action();


				return;
			}



			if (this.enabled) {
				html += "<tr><td><th><strong>This enemy ship list is based on information from turn " + vgap.plugins["enemyShipListPlugin"].firstListTurn + " up to turn " + vgap.plugins["enemyShipListPlugin"].currentListTurn + ". </strong></th></td></tr>";

				if (vgap.plugins["enemyShipListPlugin"].currentListTurn != vgap.nowTurn) {
					html += "<tr><td><th style='color:#FF0000'>Warning: this list does not include the latest turns yet.<br><br> " +
						"You will need to either incrementally go through all turns starting at turn " + ((vgap.plugins["enemyShipListPlugin"].currentListTurn) + 1) + " or use the auto update: <button type='button' class='TestButton' onClick='vgap.plugins[\"enemyShipListPlugin\"].startUpdate();'> Auto update</button> <br>" +
						"You can find more info on the configuration tab!</th></td></tr>";
				}
				if (vgap.plugins["enemyShipListPlugin"].currentListTurn > vgap.game.turn) {
					html += "<tr><td><th style='color:#FF0000'><strong>Information in this list is newer than the currently viewed turn! Most recent processed turn: " + vgap.plugins["enemyShipListPlugin"].currentListTurn + ". </strong></th></td></tr>";
				}
			} else {
				html += "<tr><td><th style='color:#FF0000'><strong>Plugin is not enabled for this game/player combination on this machine.</strong><br> ";

				if (view != 5) {
					//html += "To enable the plugin, go to the <strong><label style='text-decoration:underline; color: #FFFFFF; ' onClick='vgap.plugins[\"enemyShipListPlugin\"].showEnemyShipsView(5);'>Configuration tab</label></strong>.";              } else {



					if (vgap.nowTurn < vgap.settings.acceleratedturns) {
						html += "This game has 'accelerated Start' enabled. This plugin can only be enabled once you reach turn " + vgap.settings.acceleratedturns + ".<br>";
					} else {
						html += "To enable the plugin, select one of the options below: <br>";

						if (!vgap.settings.acceleratedturns || vgap.game.turn >= vgap.settings.acceleratedturns) {
							html += "<button type='button' class='TestButton' onClick=' " +
								"vgap.plugins[\"enemyShipListPlugin\"].enablePlugin();" +
								"vgap.plugins[\"enemyShipListPlugin\"].resetEnemyShipList();" +
								"vgap.plugins[\"enemyShipListPlugin\"].showEnemyShipsView(" + view + ");'>" +
								"Initialize list from the current turn only! </button>&nbsp;&nbsp;&nbsp;";
						}
						//html += "Initialize just from current turn: <br>";
						html += "<button type='button' class='TestButton' onClick=' " +
							"vgap.plugins[\"enemyShipListPlugin\"].enablePlugin();" +
							"vgap.plugins[\"enemyShipListPlugin\"].rebuildListFromTurn(" +
							(vgap.settings.acceleratedturns > 0 ? vgap.settings.acceleratedturns : 1) + ");'> " +
							"Build list starting from turn " + (vgap.settings.acceleratedturns > 0 ? vgap.settings.acceleratedturns : 1) +
							" (may take a while)! </button><br>";

						html += "You can find more options and detailed information on the <strong><label style='text-decoration:underline; color: #FFFFFF; ' onClick='vgap.plugins[\"enemyShipListPlugin\"].showEnemyShipsView(5);'>Configuration tab</label></strong>.";

					}

				} else {
					html += "See options below to enable the plugin.";
				}
				html += "<br></th></td></tr>";
			}

			html += "</table><br>";

			//Configuration page
			if (view == 5) {
				html += "<table id='ConfigTable' align='left' border='0' width='60%' style='cursor:pointer;'>";

				html += "<tr><td><h1>Plugin Description</h1></td></tr>";
				html += "<tr><td>This plugin keeps track of all ships not owned by you (alien). Though your own ships are also listed in some views, the normal 'Starships' view should give you a much better overview. Several list views are available as well as menu item 'EnemyShips' in the map tools that allow to show the last known locations for all know enemy ships on the starmap. When a game is opened the first time after plugin installation, the plugin will be disabled. It needs to be activated for each game/player combination. Additionally, as the plugin stores its data locally on the computer, it also needs to be enabled on each computer on which you wish to use it. <br> The most basic option is to initialize the plugin starting from just the current turn (option 'Import only current turn'). Depending on the progress of the game you should rebuild the list starting at turn 1 using the options below ('Erase list and rebuild from selected turn!' with turn 1 selected). This will go through all turns from 1 to now integrating all the data into one list. Be aware that this might take some time depending on the current turn number and your internet connection. You will see the different turn numbers come by on the dashboard. You must not interrupt the script! (Depending on the length, your browser will issue a warning and offer to cancel the script. Don't do it... It's a trap! ;) ) <br></td></tr>";
				html += "<tr><td><strong>What it does:</strong> <br> The plugin list contains all sightings of enemy ships and keeps track of them. Ships will get updated whenever newer information is available. They stay in the list until a new ship with the same ID is sighted. This does NOT mean that the ship in the list actually still exists! But at least there was no evidence against it yet.<br> " +
					"The script parses sightings, own VCRs (ship states before the combat), and combat messages. <br></td></tr>";
				html += "<tr><td><strong>What it does NOT do:</strong> <br> The plugin does not take information from allied VCRs. Unfortunately, the info taken from own VCRs consist of the state of the ship before the fight as the state afterwards is not available directly. If you see a ship being destroyed in an allied VCR, you can delete it manually from the list on the 'Single Player' list using the 'Edit' feature. Likewise, you can add ships that you saw in a VCR but not on the map. Ships destroyed by mine hits or just listed in 'Explosion' reports are also not removed as the respective messages only contain the ship name. If you feel confident enough on which ship it was, go ahead and delete it manually. <br> Also be advised that NU stores the information on beam weapons such that no equipped beam weapons despite of beam weapon slots in the hull in the same way as an unknown number of beams. Therefore, capitalships that are built without beam weapons that should be counted as freighters will be counted as capital ships... <br><br> " +
					"The plugin stores its data inside the local storage of the browser. This allows the data of all game turns to be instantly available. BUT it is not shared between different browsers, different computers, and not between subdomains of NU: planets.nu, play.planets.nu, test.planets.nu. So while you can read in and keep the list up to date on multiple computers (e.g. home computer and laptop), any custom entries you are making will ONLY be available on that machine-browser-domains combination. (There might be an import/export functionality in the future if there is much interest.)<br><br>" +
					"Plugin data can be easily deleted for the current game as well as any other game/player combination from the 'Storage Stats' tab."
				"</td></tr>";
				html += "<tr><td><br /> </td></tr>";
				html += "<tr><td><strong>Feedback:</strong><br> If you have any feedback on the performance or missing features of the plugin, please send me a private message on NU: <a href='http://planets.nu/#/account/kedalion' target='_blank' style='color:#00F7FF'>http://planets.nu/#/account/kedalion</a>. </td></tr>";

				html += "<tr><td><br /> </td></tr>";
				html += "<tr><td>Best used together with <strong>lord helmet's</strong> script '<a href='http://planets.nu/discussion/utility-script-load-your-own-ships-into-vcrsimulator' target='_blank' style='color:#00F7FF'>Planets.nu - load your owned ships in simulator'</a> found at <a href='http://userscripts.org/scripts/show/134293' target='_blank' style='color:#00F7FF'>http://userscripts.org/scripts/show/134293</a>. </td></tr>";

				html += "<tr><td><br /> </td></tr>";

				if (vgap.plugins["enemyShipListPlugin"].enabled) {
					html += "<tr><td><h1>Update all missing recent turns:</h1></td></tr>";
					html += "<tr><td>The command will use a time machine command to go to the earliest missing turn. " +
						"(Your list currently contain data up to turn " + vgap.plugins["enemyShipListPlugin"].currentListTurn + ".) " +
						"Then all more recent turns will be automatically loaded and processed. Use this option if you played some turns on a different machine and need to get the list back in sync. (You can also manually go throught the missing turns from the lowest turn till now. This is easiest on the starmap using the hotkeys.)</td></tr>";
					html += "<tr><td><button type='button' class='TestButton' onClick='vgap.plugins[\"enemyShipListPlugin\"].startUpdate();'> " +
						"Update list with missing recent turns! </button></td></tr>";

					html += "<tr><td><br /> </td></tr>";
				}

				html += "<tr><td><h1>Reset and rebuild list from specific turn:</h1></td></tr>";
				html += "<tr><td>This will empty the ship list! The command will delete all enemy ship data and rebuild it starting from the " +
					"selected turn. All more recent turns will be automatically loaded and processed. When first loading the plugin in running " +
					"games, this allows to initialize the plugin with all past information. <br> " +
					"<strong><font style='color:red'>Be aware that all previous custom entries will be lost!</font></strong> </td></tr>";

				if (vgap.nowTurn < vgap.settings.acceleratedturns) {
					html += "<tr><td><strong><font style='color:red'>This game has 'accelerated Start' enabled. This plugin can only be enabled once you reach turn " + vgap.settings.acceleratedturns + ".<br></font></strong></td></tr>";
				} else {

					var firstTurn = (vgap.settings.acceleratedturns > 0 ? vgap.settings.acceleratedturns : 1);
					html += "<tr>" +
						"<td><strong>Turn:</strong> <select id='rebuildStartTurn' >" +
						"<option value='" + firstTurn + "' selected='selected'>" + firstTurn + "</option>";

					for (var t = firstTurn + 1; t <= vgap.nowTurn; t++) {
						html += "<option value='" + t + "'>" + t + "</option>";
					}

					html += "</select></td></tr>";
					html += "<tr><td><button type='button' class='TestButton' onClick=' " +
						"var turn = document.getElementById(\"rebuildStartTurn\").options[document.getElementById(\"rebuildStartTurn\").selectedIndex].value; " +
						"vgap.plugins[\"enemyShipListPlugin\"].enablePlugin();" +
						"vgap.plugins[\"enemyShipListPlugin\"].rebuildListFromTurn(turn);'> " +
						"Erase list and rebuild from selected turn! </button></td>" +
						"</tr>";
				}
				html += "<tr><td><br /> </td></tr>";

				html += "<tr><td><h1>Import only current turn:</h1></td></tr>";
				html += "<tr><td>This will empty the ship list! It will reset the enemy ship list and initialize ONLY from the current turn. " +
					"All more recent turns will NOT be automatically loaded and processed. You will need to manually iterate through all " +
					"more recent turns in order to update. This is mostly only used for testing to see how much data is visbile in just one " +
					"turn. <br> " +
					"<strong><font style='color:red'>Be aware that all previous custom entries will be lost!</font></strong></td></tr>";

				if (vgap.game.turn < vgap.settings.acceleratedturns) {
					html += "<tr><td><strong><font style='color:red'>This game has 'accelerated Start' enabled. This plugin can only be reset to turns after the accelerated period. <br> First possible Turn: " + vgap.settings.acceleratedturns + ".<br></font></strong></td></tr>";
				} else {
					html += "<tr><td><button type='button' class='TestButton' onClick=' " +
						"vgap.plugins[\"enemyShipListPlugin\"].enablePlugin();" +
						"vgap.plugins[\"enemyShipListPlugin\"].resetEnemyShipList(); vgap.plugins[\"enemyShipListPlugin\"].showEnemyShipsView(5);'>" +
						"Reset list to just current turn! </button></td></tr>";
				}
				html += "<tr><td><br /> </td></tr>";
				html += "<tr><td><br /> </td></tr>";
				html += "<tr><td><br /> </td></tr>";
				html += "<tr><td><br /> </td></tr>";
				html += "</table>";
				html += "</div>";

				this.pane = $(html).appendTo(vgap.dash.content);

				this.pane.jScrollPane();


				// vgap.action added for the assistant (Alex):
				vgap.action();
				return;

			} else if (view == 6) { //Intel Summary

				html += "<p><h1 title='Shows the number of capital ships and freighters known (in list but not guaranteed) to number of ships shown in scoreboard. These values are ALWAYS for the most current turn in the DB and not the current game turn.'>Intel Summary</h1></p>";

				if (vgap.plugins["enemyShipListPlugin"].currentListTurn > vgap.game.turn) {
					html += "<p style='color:#FF8000'>The total number of ships belongs to the current turn (" + vgap.game.turn + ") while the number of 'known' ships belongs to the latest DB turn (" + vgap.plugins["enemyShipListPlugin"].currentListTurn + ")! Therefore more ships can be 'known' than a race actually has...</p> <br>";
				}

				// Header row
				html += "<table id='ShipTable' align='left' border='0' width='100%' style='cursor:pointer;'><thead>";

				html += "<th align='left'>Id</th>";
				html += "<th align='left'>Player</th>";
				html += "<th align='left'>Race</th>";

				html += "<th align='left' title='Click here to sort by percentage of capital ships known.'>Capital Ships</th>";
				html += "<th align='left' title='Click here to sort by percentage of freighters known.'>Freigthers</th>";
				html += "<th align='left'>Total Ships</th>";

				html += "</thead><tbody id='ShipRows' align=left  >";
				html += "</tbody></table><p>&nbsp;</p></div>";

				this.pane = $(html).appendTo(vgap.dash.content);

				//iterate over all player

				for (var p = 0; p < vgap.players.length; p++) {

					html = "";

					capitalships_in_list = 0;
					freighters_in_list = 0;

					//for single player view: determine number of warships and freighters for this player
					var player = vgap.players[p]; //getPlayer(vgap.plugins["enemyShipListPlugin"].playerFilterId);
					capitalships_total = getNumForPlayer(player.id, "capitalships");
					freighters_total = getNumForPlayer(player.id, "freighters");

					for (var i = 0; i < vgap.plugins["enemyShipListPlugin"].enemyShipList.length; i++) {
						var ship = vgap.plugins["enemyShipListPlugin"].enemyShipList[i];

						if (ship.ownerid != player.id)
							continue;

						//support for sphere addon: don't count ships with negative id
						if (ship.id < 0)
							continue;

						var hull = vgap.getHull(ship.hullid);
						if ((hull.beams == 0 || (ship.beamid == 0 && ship.ownerid == vgap.player.id)) && (hull.launchers == 0 || (ship.torpedoid == 0 && ship.ownerid == vgap.player.id)) && hull.fighterbays == 0) {
							freighters_in_list++;
						} else {
							capitalships_in_list++;
						}
					}
					var race = vgap.getRace(player.raceid);

					//console.log("Player: " + player.id + " playing race: " + race.shortname + " and name: " + player.username);

					var color = this.colorsA[player.id];;
					html += "<tr>";

					html += "<td style='color:" + color + "'>" + player.id + "</td>";
					html += "<td style='color:" + color + "'>" + player.username + "</td>";
					html += "<td style='color:" + color + "'>" + race.shortname + "</td>";
					html += "<td style='color:" + color + "'> <div style='display: none;'>" + (capitalships_in_list / capitalships_total) + "</div>" + capitalships_in_list + " / " + capitalships_total + "</td>";
					html += "<td style='color:" + color + "'> <div style='display: none;'>" + (freighters_in_list / freighters_total) + "</div>" + freighters_in_list + " / " + freighters_total + "</td>";
					html += "<td style='color:" + color + "'>" + (freighters_total + capitalships_total) + "</td>";
					html += "</tr>";

					var select = function (playerid) { return function () { vgap.plugins["enemyShipListPlugin"].playerFilterId = playerid; vgap.plugins["enemyShipListPlugin"].showEnemyShipsView(3); } };
					$(html).click(select(player.id)).appendTo("#ShipRows");


				}



				//this.pane = $(html).appendTo(vgap.dash.content);

				//make ship table sortable
				$("#ShipTable").tablesorter();

				this.pane.jScrollPane();


				// vgap.action added for the assistant (Alex):
				vgap.action();
				return;

			}



			//Single player: player selection box and
			if (view == 3 || view == 4) {
				html += "<table id='PlayerSelectionTable' align='left' border='0' width='60%' style='cursor:pointer;'>";
				html += "<tr>";

				if (view == 3) {
					html += "<td><strong>Select Player:</strong> <select id='shipListPlayer' " +
						"onChange='vgap.plugins[\"enemyShipListPlugin\"].playerFilterId = this.options[this.selectedIndex].value; " +
						"vgap.plugins[\"enemyShipListPlugin\"].showEnemyShipsView(3);'>";

					for (var p = 0; p < vgap.players.length; p++) {
						html += "<option ";
						if (vgap.players[p].id == vgap.plugins["enemyShipListPlugin"].playerFilterId) {
							html += "selected='selected' ";
						}
						html += "value='" + vgap.players[p].id + "'>" + vgap.players[p].id + " - " + vgap.players[p].fullname + "</option>";
					}
					html += "</select> <br></td>";
				}

				html += "<td>Show unknown ship slots: <input type='checkbox' " + (vgap.plugins["enemyShipListPlugin"].includeUnknown ? "checked='yes' " : "") + "id='includeUnknownBox' onclick='vgap.plugins[\"enemyShipListPlugin\"].includeUnknown = this.checked; vgap.plugins[\"enemyShipListPlugin\"].showEnemyShipsView(" + view + ");' /></td</tr>";

				if (view == 3) {
					html += "<td>Enable edit: <input type='checkbox' " + (vgap.plugins["enemyShipListPlugin"].enableEdit ? "checked='yes' " : "") + "id='enableEditBox' onclick='vgap.plugins[\"enemyShipListPlugin\"].enableEdit = this.checked; vgap.plugins[\"enemyShipListPlugin\"].showEnemyShipsView(" + view + ");' /></td</tr>";
				}
				html += "</table>";
			}

			//section heading only needed if in single player view
			if (view == 3) {

				if (vgap.plugins["enemyShipListPlugin"].enableEdit) {

					html += "<p>&nbsp;</p>";
					html += "<div id='ShipEditArea'><table id='ShipEditTable' align='left' border='0' width='100%' style='cursor:pointer;'><thead>";

					html += "<th align='left'>Id</th>";
					html += "<th align='left'>Hull</th>";
					html += "<th align='left'>Ship Name</th>";
					html += "<th align='left'>Turn</th>";
					html += "<th align='left'>X</th>";
					html += "<th align='left'>Y</th>";
					html += "<th align='left'>Engine(s)</th>";
					html += "<th align='left'>#Beams</th>";
					html += "<th align='left'>Beamtype</th>";
					html += "<th align='left'>#Tubes</th>";
					html += "<th align='left'>Tubestype</th>";
					html += "<th align='left'>Ammo</th>";
					html += "<th align='left'>Mass</th>";
					html += "<th align='left'>Crew</th>";
					html += "<th align='left'>Damage</th>";
					html += "<th align='left'>Save</th>";
					html += "</thead><tbody id='ShipEditRows' align=left  >";

					html += "<td><select id='shipIdCombo'>";

					var id = 1;
					for (var s = 0; s < vgap.plugins["enemyShipListPlugin"].enemyShipList.length; s++) {
						var ship = vgap.plugins["enemyShipListPlugin"].enemyShipList[s];
						while (id < parseInt(ship.id)) {
							html += "<option value='" + id + "'>" + id + "</option>";
							id++;
						}
						id = parseInt(ship.id) + 1;
					}
					//								while (id <= vgap.settings.shiplimit) {
					while (id <= vgap.plugins["enemyShipListPlugin"].max_ship_id) {
						html += "<option value='" + id + "'>" + id + "</option>";
						id++;
					}
					html += "</select> <br></td>";

					html += "<td><select id='shipHullCombo' onChange=' " +
						"var val = this.options[this.selectedIndex].value; " +
						"if (val != 0) { " +
						"  var hull = vgap.getHull(val); " +
						"  document.getElementById(\"shipNameTextbox\").value = hull.name; " +
						"  document.getElementById(\"shipNumBeamsTextbox\").value = hull.beams; " +
						"  document.getElementById(\"shipNumTubesTextbox\").value = hull.launchers; " +
						"  document.getElementById(\"shipCrewTextbox\").value = hull.crew; " +
						"}'>";

					//add only the race specific hulls first
					var player = vgap.getPlayer(vgap.plugins["enemyShipListPlugin"].playerFilterId);
					var race = vgap.getRace(player.raceid);

					for (var h = 0; h < race.hulls.split(",").length; h++) {
						html += "<option ";
						html += "value='" + race.hulls.split(",")[h] + "'>" + vgap.getHull(race.hulls.split(",")[h]).name + "</option>";
					}
					html += "<option value='0'>-----------</option>";

					//now all others (duplicate with the race hulls, but not important
					for (var h = 0; h < vgap.hulls.length; h++) {
						html += "<option ";
						html += "value='" + vgap.hulls[h].id + "'>" + vgap.hulls[h].name + "</option>";
					}

					html += "</select> <br></td>";
					html += "<td><input type='text' id='shipNameTextbox' size='40'></td>";
					html += "<td><input type='text' id='shipTurnTextbox' size='2' value='" + vgap.game.turn + "'></td>";
					html += "<td><input type='text' id='shipXTextbox' size='3' value='2000'></td>";
					html += "<td><input type='text' id='shipYTextbox' size='3' value='2000'></td>";

					//engines
					html += "<td><select id='shipEngineCombo' onChange='function() {}'>";
					html += "<option value='0'>Unknown</option>";
					for (var h = 0; h < vgap.engines.length; h++) {
						html += "<option ";
						html += "value='" + vgap.engines[h].id + "'>" + vgap.engines[h].name + "</option>";
					}
					html += "</select> <br></td>";

					//beam weapons
					html += "<td><input type='text' id='shipNumBeamsTextbox' size='2' value='0'></td>";
					html += "<td><select id='shipBeamCombo' onChange='function() {}'>";
					html += "<option value='0'>Unknown</option>";
					for (var h = 0; h < vgap.beams.length; h++) {
						html += "<option ";
						html += "value='" + vgap.beams[h].id + "'>" + vgap.beams[h].name + "</option>";
					}
					html += "</select> <br></td>";

					//torpedo tubes
					html += "<td><input type='text' id='shipNumTubesTextbox' size='2' value='0'></td>";
					html += "<td><select id='shipTubeCombo' onChange='function() {}'>";
					html += "<option value='0'>Unknown</option>";
					for (var h = 0; h < vgap.torpedos.length; h++) {
						html += "<option ";
						html += "value='" + vgap.torpedos[h].id + "'>" + vgap.torpedos[h].name + "</option>";
					}
					html += "</select> <br></td>";

					html += "<td><input type='text' id='shipAmmoTextbox' size='4' value='0'></td>";
					html += "<td><input type='text' id='shipMassTextbox' size='4' value='0'></td>";
					html += "<td><input type='text' id='shipCrewTextbox' size='4' value='1'></td>";
					html += "<td><input type='text' id='shipDamageTextbox' size='3' value='0'></td>";

					html += "<td><button type='button' class='TestButton' onClick='" +
						"var n = {}; " +
						"n.id = document.getElementById(\"shipIdCombo\").options[document.getElementById(\"shipIdCombo\").selectedIndex].value; " +
						"n.name = document.getElementById(\"shipNameTextbox\").value; " +
						"n.ownerid = vgap.plugins[\"enemyShipListPlugin\"].playerFilterId; " +
						"n.hullid = document.getElementById(\"shipHullCombo\").options[document.getElementById(\"shipHullCombo\").selectedIndex].value; " +
						"n.mass = document.getElementById(\"shipMassTextbox\").value; " +
						"n.x = document.getElementById(\"shipXTextbox\").value; " +
						"n.y = document.getElementById(\"shipYTextbox\").value; " +
						"n.engineid = document.getElementById(\"shipEngineCombo\").options[document.getElementById(\"shipEngineCombo\").selectedIndex].value; " +
						"n.beamid = document.getElementById(\"shipBeamCombo\").options[document.getElementById(\"shipBeamCombo\").selectedIndex].value; " +
						"n.beams = document.getElementById(\"shipNumBeamsTextbox\").value; " +
						"n.torpedoid = document.getElementById(\"shipTubeCombo\").options[document.getElementById(\"shipTubeCombo\").selectedIndex].value; " +
						"n.torps = document.getElementById(\"shipNumTubesTextbox\").value; " +
						"n.ammo = document.getElementById(\"shipAmmoTextbox\").value; " +
						"n.crew = document.getElementById(\"shipCrewTextbox\").value; " +
						"n.damage = document.getElementById(\"shipDamageTextbox\").value; " +
						"n.infoturn = document.getElementById(\"shipTurnTextbox\").value; " + //console.log('right here');" +
						"vgap.plugins[\"enemyShipListPlugin\"].addShip(n, false); vgap.plugins[\"enemyShipListPlugin\"].showEnemyShipsView(" + view + ");" +
						"'> Save </button></td>";

					html += "</tr>";

					html += "</tbody></table></div><p>&nbsp;</p>";




				}




				html += "<br><br><p><h1 title='You have " + capitalships_in_list + " warships in the list while the player has " + capitalships_total + " according to the scoreboard.'>Warships (" + capitalships_in_list + " / " + capitalships_total + ")</h1></p>";
			}

			// Header row
			html += "<table id='ShipTable' align='left' border='0' width='100%' style='cursor:pointer;'><thead>";

			html += "<th align='left'>Player</th>";
			html += "<th align='left'>Race</th>";
			html += "<th align='left'>Id</th>";
			html += "<th align='left'>Hull</th>";
			html += "<th align='left'>Ship Name</th>";
			if (vgap.plugins["enemyShipListPlugin"].enableEdit) {
				html += "<th align='left'>Delete</th>";
			}
			html += "<th align='left'>Turn</th>";
			html += "<th align='left'>Location</th>";
			html += "<th align='left'>Engine</th>";
			html += "<th align='left'>Beams</th>";
			html += "<th align='left'>Launcher/Bays</th>";
			html += "<th align='left'>Ammo</th>";
			html += "<th align='left'>Mass</th>";
			html += "<th align='left'>Crew</th>";
			html += "<th align='left'>Damage</th>";

			html += "</thead><tbody id='ShipRows' align=left  >";
			html += "</tbody></table><p>&nbsp;</p>";


			//table for freighter section in single player view
			if (view == 3) {

				html += "<p><h1 title='You have " + freighters_in_list + " freighters in the list while the player has " + freighters_total + " according to the scoreboard.'>Freighters (" + freighters_in_list + " / " + freighters_total + ")</h1></p>";

				// Header row
				html += "<table id='FreighterTable' align='left' border='0' width='100%' style='cursor:pointer;'><thead>";

				html += "<th align='left'>Player</th>";
				html += "<th align='left'>Race</th>";
				html += "<th align='left'>Id</th>";
				html += "<th align='left'>Hull</th>";
				html += "<th align='left'>Ship Name</th>";
				if (vgap.plugins["enemyShipListPlugin"].enableEdit) {
					html += "<th align='left'>Delete</th>";
				}
				html += "<th align='left'>Turn</th>";
				html += "<th align='left'>Location</th>";
				html += "<th align='left'>Engine</th>";
				html += "<th align='left'>Beams</th>";
				html += "<th align='left'>Launcher/Bays</th>";
				html += "<th align='left'>Ammo</th>";
				html += "<th align='left'>Mass</th>";
				html += "<th align='left'>Crew</th>";
				html += "<th align='left'>Damage</th>";

				html += "</thead><tbody id='FreighterRows' align=left  >";
				html += "</tbody></table><p>&nbsp;</p>";
			}

			html += "</div>";
			this.pane = $(html).appendTo(vgap.dash.content);


			//this.pane = $(html).appendTo(vgap.dash.content);
			// Ship List

			//				var colorsA =["#F0F8FF","#32CD32","#CD5C5C","#FFC0CB","#98FB98","#C0C0C0","#FFFF00","#EE82EE","#D3D3D3","#B0E0E6","#87CEFA","#7B68EE","#F4A460","#D2B48C","#FF6347","#F5DEB3","#F08080","#2F4F4F","#008080","#B22222","#808000","#9370DB","#00FF00","#4B0082","#D2B48C","#9ACD32", "#DAA520","#F0F8FF","#6B8E23","#FF4500"];
			//				var colorsA2 =["#FFFFFF","#006400","#FF0000","#FF69B4","#00FA9A","#6A5ACD","#FFD700","#9400D3","#808080","#00CED1","#4169E1","#7B68EE","#A0522D","#87CEEB","#FF6347","#F5DEB3","#F08080","#2F4F4F","#008080","#B22222","#808000","#9370DB","#00FF00","#4B0082","#D2B48C","#9ACD32", "#DAA520","#F0F8FF","#6B8E23","#FF4500"];


			var war_count = 0;
			var freighter_count = 0;

			//go through all IDs
			//				for (var id = 1; id <= vgap.settings.shiplimit; id++) {
			for (var id = 1; id <= vgap.plugins["enemyShipListPlugin"].max_ship_id; id++) {

				var html = "";

				var ship_in_list = false;
				var ship = "";
				//see if the ship exist in the list
				for (var j = 0; j < vgap.plugins["enemyShipListPlugin"].enemyShipList.length; j++) {
					ship = vgap.plugins["enemyShipListPlugin"].enemyShipList[j];
					if (ship.id == id) {
						ship_in_list = true;
						break;
					}
				}

				if (!ship_in_list) {

					//not in list: if setting -> include unknown entry
					if (vgap.plugins["enemyShipListPlugin"].includeUnknown && view == 4) {

						var color = this.colorsA[0];
						html += "<tr>";

						html += "<td title='Player slot: ?' style='color:" + color + "'> ? </td>";
						html += "<td style='color:" + color + "'> ? </td>";
						html += "<td style='color:" + color + "'>" + id + "</td>";
						html += "<td style='color:" + color + "'> ? </td>";
						html += "<td style='color:" + color + "'> ? </td>";
						if (vgap.plugins["enemyShipListPlugin"].enableEdit) {
							html += "<td></td>";
						}
						//html += "<td style='color:"+ color +"'>" + vgap.game.turn - ship.infoturn + "</td>";
						html += "<td style='color:" + color + "'> ? </td>";
						html += "<td style='color:" + color + "'> ? </td>";
						//html += "<td style='color:"+ color +"'>" + hull.name + "</td>";
						//html += "<td style='color:"+ color +"' align='center'>" + ship.warp + "</td>";
						html += "<td style='color:" + color + "'> ? </td>";
						//html += "<td style='color:"+ color +"'>" + damage + "</td>";
						//html += "<td style='color:"+ color +"'>" + crew + "</td>";
						html += "<td style='color:" + color + "'> ? </td>";
						html += "<td style='color:" + color + "'> ? </td>";
						html += "<td style='color:" + color + "'> ? </td>";
						html += "<td style='color:" + color + "'> ? </td>";
						html += "<td style='color:" + color + "'> ? </td>";
						html += "<td style='color:" + color + "'> ? </td>";

						html += "</tr>";

						$(html).appendTo("#ShipRows");
					}
				} else {

					//ships of other players
					if (view == 0) {
						if (ship.ownerid == vgap.player.id)
							continue;
					}

					//allies (safe passage already counts
					if (view == 1) {
						if (!vgap.alliedTo(ship.ownerid))
							continue;
						if (ship.ownerid == vgap.player.id)
							continue;
					}

					//non-allies
					if (view == 2) {
						if (vgap.alliedTo(ship.ownerid))
							continue;
						if (ship.ownerid == vgap.player.id)
							continue;
					}

					//single player
					if (view == 3) {
						if (ship.ownerid != vgap.plugins["enemyShipListPlugin"].playerFilterId)
							continue;
					}


					//extract and prepare data
					var hull = vgap.getHull(ship.hullid);
					var player = vgap.getPlayer(ship.ownerid);
					var race = vgap.getRace(player.raceid);
					var color = this.colorsA[ship.ownerid];
					var location = "(" + ship.x + "," + ship.y + ")"; //"Deep Space";
					var engine = "?";
					var ammo = (ship.ammo == -1) ? "?" : ship.ammo;
					var beam_weapons = "?";
					var crew = (ship.crew == -1) ? "?" : ship.crew;
					var damage = (ship.damage == -1) ? "?" : ship.damage;

					if (ship.engineid > 0) {
						engine = vgap.getEngine(ship.engineid).name;
					}

					//if (ship.ammo!=-1)
					//	ammo=ship.ammo;

					//get beam weapons
					if (hull.beams == 0)// || ship.beamid == 0 || ship.beams == 0)
						beam_weapons = "---";
					else if (ship.beams != 0 && ship.beamid != 0) {
						beam_weapons = ship.beams + " " + vgap.getBeam(ship.beamid).name;
					}

					//get secondary weapons
					if (hull.fighterbays > 0) {
						secondary_weapons = hull.fighterbays + " Fighter " + (hull.fighterbays == 1 ? "Bay" : "Bays");
					} else if (hull.launchers > 0) {
						if (ship.torps == -1 || ship.torpedoid == -1)
							secondary_weapons = "?";
						else if (ship.torps == 0 || ship.torpedoid == 0)
							secondary_weapons = "---";
						else
							secondary_weapons = ship.torps + " " + vgap.getTorpedo(ship.torpedoid).name + (ship.torps == 1 ? " Tube" : " Tubes");
					} else {
						secondary_weapons = "---";
					}

					html += "<tr>";

					html += "<td title='Player slot " + ship.ownerid + "' style='color:" + color + "'>" + player.username + "</td>";
					html += "<td style='color:" + color + "'>" + race.shortname + "</td>";
					html += "<td style='color:" + color + "'>" + ship.id + "</td>";
					html += "<td title='" + hull.name + "'><img class='TinyIcon' src='" + hullImg(ship.hullid) + "'/><div style='display: none;'>" + hull.name + "</div></td>";
					html += "<td style='color:" + color + "'>" + ship.name + "</td>";
					if (vgap.plugins["enemyShipListPlugin"].enableEdit) {
						html += "<td><button type='button' class='TestButton' onClick='vgap.plugins[\"enemyShipListPlugin\"].removeShip(" + ship.id + "); " +
							"vgap.plugins[\"enemyShipListPlugin\"].showEnemyShipsView(" + view + ");'> Delete </button></td>";
					}
					html += "<td style='color:" + color + "'>" + ship.infoturn + "</td>";
					html += "<td style='color:" + color + "'>" + location + "</td>";
					//html += "<td style='color:"+ color +"' align='center'>" + ship.warp + "</td>";
					html += "<td style='color:" + color + "'>" + engine + "</td>";
					html += "<td style='color:" + color + "'>" + beam_weapons + "</td>";
					html += "<td style='color:" + color + "'>" + secondary_weapons + "</td>";
					html += "<td style='color:" + color + "'>" + ammo + "</td>";
					html += "<td style='color:" + color + "'>" + ship.mass + "</td>";
					html += "<td style='color:" + color + "'>" + crew + "</td>";
					html += "<td style='color:" + color + "'>" + damage + "</td>";

					html += "</tr>";

					//add ship to correct table and register methods to show map on click
					if (view != 3) {

						var select = function (x, y) { return function () { vgap.showMap(); vgap.map.centerMap(x, y); /*console.log("Come here: " + x + "," + y);*/ }; };
						$(html).click(select(ship.x, ship.y)).appendTo("#ShipRows");

					} else {
						//determine if freighter or not
						if (hull.beams == 0 && hull.launchers == 0 && hull.fighterbays == 0) {

							if (vgap.plugins["enemyShipListPlugin"].enableEdit) {
								$(html).appendTo("#FreighterRows");
							} else {
								var select = function (x, y) { return function () { vgap.showMap(); vgap.map.centerMap(x, y); /*console.log("Come here: " + x + "," + y);*/ }; };
								$(html).click(select(ship.x, ship.y)).appendTo("#FreighterRows");
							}

							//increase freighter count
							freighter_count++;
						} else {

							if (vgap.plugins["enemyShipListPlugin"].enableEdit) {
								$(html).appendTo("#ShipRows");
							} else {
								var select = function (x, y) { return function () { vgap.showMap(); vgap.map.centerMap(x, y); /*console.log("Come here: " + x + "," + y);*/ }; };
								$(html).click(select(ship.x, ship.y)).appendTo("#ShipRows");
							}
							//increase warship count
							war_count++;
						}
					}
				}
			}

			if (view == 3 && vgap.plugins["enemyShipListPlugin"].includeUnknown) {

				var player = vgap.getPlayer(vgap.plugins["enemyShipListPlugin"].playerFilterId);
				var race = vgap.getRace(player.raceid);

				//add freighters and warships to end of list

				for (var i = war_count + 1; i <= getNumForPlayer(player.id, "capitalships"); i++) {

					var html = "";
					var color = this.colorsA[player.id];
					html += "<tr>";

					html += "<td title='Player slot " + player.id + "' style='color:" + color + "'>" + player.username + "</td>";
					html += "<td style='color:" + color + "'>" + race.shortname + "</td>";
					html += "<td style='color:" + color + "'> ? </td>";
					html += "<td style='color:" + color + "'> ? </td>";
					html += "<td style='color:" + color + "'> ? </td>";
					if (vgap.plugins["enemyShipListPlugin"].enableEdit) {
						html += "<td></td>";
					}
					//html += "<td style='color:"+ color +"'>" + vgap.game.turn - ship.infoturn + "</td>";
					html += "<td style='color:" + color + "'> ? </td>";
					html += "<td style='color:" + color + "'> ? </td>";
					//html += "<td style='color:"+ color +"'>" + hull.name + "</td>";
					//html += "<td style='color:"+ color +"' align='center'>" + ship.warp + "</td>";
					html += "<td style='color:" + color + "'> ? </td>";
					//html += "<td style='color:"+ color +"'>" + damage + "</td>";
					//html += "<td style='color:"+ color +"'>" + crew + "</td>";
					html += "<td style='color:" + color + "'> ? </td>";
					html += "<td style='color:" + color + "'> ? </td>";
					html += "<td style='color:" + color + "'> ? </td>";
					html += "<td style='color:" + color + "'> ? </td>";
					html += "<td style='color:" + color + "'> ? </td>";
					html += "<td style='color:" + color + "'> ? </td>";

					html += "</tr>";

					$(html).appendTo("#ShipRows");
				}

				for (var i = freighter_count + 1; i <= getNumForPlayer(player.id, "freighters"); i++) {

					var html = "";
					var color = this.colorsA[player.id];
					html += "<tr>";

					html += "<td title='Player slot " + player.id + "' style='color:" + color + "'>" + player.username + "</td>";
					html += "<td style='color:" + color + "'>" + race.shortname + "</td>";
					html += "<td style='color:" + color + "'> ? </td>";
					html += "<td style='color:" + color + "'> ? </td>";
					html += "<td style='color:" + color + "'> ? </td>";
					if (vgap.plugins["enemyShipListPlugin"].enableEdit) {
						html += "<td></td>";
					}
					//html += "<td style='color:"+ color +"'>" + vgap.game.turn - ship.infoturn + "</td>";
					html += "<td style='color:" + color + "'> ? </td>";
					html += "<td style='color:" + color + "'> ? </td>";
					//html += "<td style='color:"+ color +"'>" + hull.name + "</td>";
					//html += "<td style='color:"+ color +"' align='center'>" + ship.warp + "</td>";
					html += "<td style='color:" + color + "'> ? </td>";
					//html += "<td style='color:"+ color +"'>" + damage + "</td>";
					//html += "<td style='color:"+ color +"'>" + crew + "</td>";
					html += "<td style='color:" + color + "'> --- </td>";
					html += "<td style='color:" + color + "'> --- </td>";
					html += "<td style='color:" + color + "'> --- </td>";
					html += "<td style='color:" + color + "'> ? </td>";
					html += "<td style='color:" + color + "'> ? </td>";
					html += "<td style='color:" + color + "'> ? </td>";

					html += "</tr>";

					$(html).appendTo("#FreighterRows");
				}
			}


			//make ship table sortable
			$("#ShipTable").tablesorter();

			//make freighter table sortable
			if (view == 3) {
				$("#FreighterTable").tablesorter();
			}

			this.pane.jScrollPane();

			// vgap.action added for the assistant (Alex):
			vgap.showShipsViewed = 1;
			vgap.action();
		},

		/**
		 * Draw last location of enemy ships on the map
		 */
		drawEnemyShips: function () {

			var range = this.getTurnRange();

			//single ship filter overrides the player selection
			if (this.shipFilterId) {
				var filtered = this.getShipById(this.shipFilterId);
				if (filtered && vgap.game.turn >= filtered.infoturn) {
					this.drawShipMarker(filtered, range);
				}
				return;
			}

			var drawShips = false;

			for (var p = 0; p <= vgap.players.length; p++) {
				if (this.drawSelection[p] == true) {
					drawShips = true;
					break;
				}
			}

			if (drawShips == false)
				return;
			for (var s = 0; s < vgap.plugins["enemyShipListPlugin"].enemyShipList.length; s++) {
				var ship = vgap.plugins["enemyShipListPlugin"].enemyShipList[s];
				if (vgap.game.turn < ship.infoturn)
					continue;
				if (vgap.plugins["enemyShipListPlugin"].drawSelection[0] || vgap.plugins["enemyShipListPlugin"].drawSelection[ship.ownerid]) {
					this.drawShipMarker(ship, range);
				}



			}
		},

		/**
		 * Draw the last known location of a ship within the turn range and its movement history
		 * @param ship		ship to draw
		 * @param range		turn range from getTurnRange
		 */
		drawShipMarker: function (ship, range) {
			var sightings = this.getSightingsInRange(ship, range);
			if (sightings.length == 0)
				return;

			var markup = { attr: { stroke: this.colorsA[ship.ownerid] } };
			var last = sightings[sightings.length - 1];
			//only mark the last known location when the ship is not visible on the viewed turn
			if (last.turn != vgap.game.turn) {
				this.drawScaledCircle(last.x, last.y, vgap.plugins["enemyShipListPlugin"].drawRadius, markup.attr, null);
			}

			//fade older path segments only for the full turn range or the default window, not custom ranges
			var fade = (range.to == range.max && (range.from == range.min || range.from == range.defaultFrom));
			for (var sh = 1; sh < sightings.length; sh++) {
				var alpha = 1;
				if (fade) {
					alpha = Math.max(this.historyMinAlpha, 1 - this.historyFadeStep * (range.max - sightings[sh].turn));
				}
				this.drawLine(sightings[sh - 1].x, sightings[sh - 1].y, sightings[sh].x, sightings[sh].y, markup.attr, null, alpha);
			}
		},

		/**
		 * Get the turn range to display, clamped to first list turn and current turn
		 * @return      {min, max, from, to, defaultFrom}
		 */
		getTurnRange: function () {
			var plugin = vgap.plugins["enemyShipListPlugin"];
			var max = vgap.game.turn;
			var min = Math.min(parseInt(plugin.firstListTurn, 10) || 1, max);
			var defaultFrom = Math.max(min, max - plugin.defaultTurnSpan + 1);
			var from = (plugin.turnFrom != null) ? Math.min(Math.max(plugin.turnFrom, min), max) : defaultFrom;
			var to = plugin.turnTo ? Math.min(Math.max(plugin.turnTo, from), max) : max;
			return { min: min, max: max, from: from, to: to, defaultFrom: defaultFrom };
		},

		/**
		 * Get the positions a ship was seen at within a turn range, oldest first
		 * @param ship		ship
		 * @param range		turn range from getTurnRange
		 * @return 			list of {turn, x, y}
		 */
		getSightingsInRange: function (ship, range) {
			var sightings = [];
			var keyList = ship.history ? Object.keys(ship.history) : [];
			for (var k = 0; k < keyList.length; k++) {
				var turn = parseInt(keyList[k], 10);
				if (!isNaN(turn)) {
					sightings.push({ turn: turn, x: ship.history[keyList[k]].x, y: ship.history[keyList[k]].y });
				}
			}
			//ships without history (e.g. added manually) only have their last sighting
			if (sightings.length == 0) {
				sightings.push({ turn: parseInt(ship.infoturn, 10), x: ship.x, y: ship.y });
			}

			sightings = sightings.filter(function (s) { return s.turn >= range.from && s.turn <= range.to; });
			sightings.sort(function (a, b) { return a.turn - b.turn; });
			return sightings;
		},

		/**
		 * Set the turn range to display and refresh the map and filter controls
		 * @param from		first turn to show
		 * @param to		last turn to show
		 */
		setTurnRange: function (from, to) {
			var plugin = vgap.plugins["enemyShipListPlugin"];
			var range = plugin.getTurnRange();
			//keep following the default window while the slider sits on it
			plugin.turnFrom = (from == range.defaultFrom) ? null : from;
			plugin.turnTo = (to >= range.max) ? 0 : to;

			//drop the single ship filter if that ship was not seen in the new range
			var filtered = plugin.getShipById(plugin.shipFilterId);
			if (filtered && plugin.getSightingsInRange(filtered, plugin.getTurnRange()).length == 0) {
				plugin.shipFilterId = 0;
			}

			vgap.map.draw();

			//only refresh the ship dropdown; rebuilding the whole tool would take focus away from the slider
			$("#EnemyShipFilterSelect").replaceWith(plugin.buildShipFilterSelect());
		},

		/**
		 * Build the from/to turn sliders
		 * @return      jQuery element
		 */
		buildTurnRangeControl: function () {
			var plugin = vgap.plugins["enemyShipListPlugin"];
			var range = plugin.getTurnRange();

			var container = $("<div id='EnemyShipTurnRange'></div>");
			var header = $("<div></div>").appendTo(container);
			var label = $("<span></span>").appendTo(header);
			var resetButton = $("<button type='button' style='margin-left:8px;'>Reset</button>").appendTo(header);
			var fromRow = $("<div>From </div>").appendTo(container);
			var fromInput = $("<input type='range' style='width:140px; vertical-align:middle;'>").attr({ min: range.min, max: range.max }).val(range.from).appendTo(fromRow);
			var toRow = $("<div>To&nbsp;&nbsp;&nbsp;&nbsp; </div>").appendTo(container);
			var toInput = $("<input type='range' style='width:140px; vertical-align:middle;'>").attr({ min: range.min, max: range.max }).val(range.to).appendTo(toRow);

			var updateLabel = function () { label.text("Turns " + fromInput.val() + " to " + toInput.val()); };

			//keep from <= to while dragging
			fromInput.on("input", function () {
				if (parseInt(fromInput.val(), 10) > parseInt(toInput.val(), 10)) toInput.val(fromInput.val());
				updateLabel();
			});
			toInput.on("input", function () {
				if (parseInt(toInput.val(), 10) < parseInt(fromInput.val(), 10)) fromInput.val(toInput.val());
				updateLabel();
			});
			container.find("input").on("change", function () {
				plugin.setTurnRange(parseInt(fromInput.val(), 10), parseInt(toInput.val(), 10));
			});
			//restore the default window (last defaultTurnSpan turns up to the current turn)
			resetButton.on("click", function () {
				plugin.turnFrom = null;
				plugin.turnTo = 0;
				var defaults = plugin.getTurnRange();
				fromInput.val(defaults.from);
				toInput.val(defaults.to);
				updateLabel();
				plugin.setTurnRange(defaults.from, defaults.to);
			});
			//keep slider interaction from reaching the starmap
			container.find("input, button").on("mousedown mousemove click touchstart touchmove", function (e) { e.stopPropagation(); });
			//keep arrow keys on the focused slider from reaching the NU hotkeys
			container.find("input, button").on("keydown", function (e) { e.stopPropagation(); });

			updateLabel();
			return container;
		},

		/**
		 * Generate the content for the enemy ship dashboard tab
		 * @param x			x coordinate of ship
		 * @param y			y coordinate of ship
		 * @param radius	radius of circle
		 * @param attr		color of the drawing
		 * @param paperset	where to draw
		 */
		drawScaledCircle: function (x, y, radius, attr, paperset) {
			if (!vgap.map.isVisible(x, y, radius)) return;
			radius *= vgap.map.zoom;
			if (radius <= 1)
				radius = 1;
			if (paperset == null)
				paperset = vgap.map.ctx;
			paperset.strokeStyle = attr.stroke;
			paperset.beginPath();
			paperset.arc(vgap.map.screenX(x), vgap.map.screenY(y), radius, 0, Math.PI * 2, false);
			paperset.stroke();
		},
		/**
		 * Generate the content for the enemy ship dashboard tab
		 * @param x			x coordinate of ship
		 * @param y			y coordinate of ship
		 * @param radius	radius of circle
		 * @param attr		color of the drawing
		 * @param paperset	where to draw
		 * @param alpha		opacity of the line (default 1)
		 */
		drawLine: function (x1, y1, x2, y2, attr, paperset, alpha) {
			//if (!vgap.map.isVisible(x, y, radius)) return;
			if (paperset == null) {
				paperset = vgap.map.ctx;
			}

			paperset.save();
			paperset.strokeStyle = attr.stroke;
			paperset.globalAlpha = (alpha == null) ? 1 : alpha;
			paperset.beginPath();
			paperset.moveTo(vgap.map.screenX(x1), vgap.map.screenY(y1));
			paperset.lineTo(vgap.map.screenX(x2), vgap.map.screenY(y2));
			paperset.closePath();
			paperset.stroke();
			paperset.restore();
		},

		toggleSelectionHelper: function () {
			vgap.plugins["enemyShipListPlugin"].toggleSelection(this);
		},
		/**
				 * Toggle the checkbox deciding which player's ships are being displayed
				 * @param id		id of player to toggle
				 */
		toggleSelection: function (id) {


			if (id < 0 || id > vgap.players.length) {
				return;
			}

			vgap.plugins["enemyShipListPlugin"].drawSelection[id] = !vgap.plugins["enemyShipListPlugin"].drawSelection[id];

			if (id == 0) {
				//toggle or untoggle all
				for (var i = 1; i < vgap.plugins["enemyShipListPlugin"].drawSelection.length; i++) {
					vgap.plugins["enemyShipListPlugin"].drawSelection[i] = vgap.plugins["enemyShipListPlugin"].drawSelection[id];
				}
			} else {
				//toggle the 'All' checkbox
				vgap.plugins["enemyShipListPlugin"].drawSelection[0] = true;
				for (var i = 1; i < vgap.plugins["enemyShipListPlugin"].drawSelection.length; i++) {
					if (!vgap.plugins["enemyShipListPlugin"].drawSelection[i]) {
						vgap.plugins["enemyShipListPlugin"].drawSelection[0] = false;
					}
				}
			}

			//drop the single ship filter if its owner is no longer selected
			var filtered = vgap.plugins["enemyShipListPlugin"].getShipById(vgap.plugins["enemyShipListPlugin"].shipFilterId);
			if (filtered && !vgap.plugins["enemyShipListPlugin"].isOwnerSelected(filtered.ownerid)) {
				vgap.plugins["enemyShipListPlugin"].shipFilterId = 0;
			}

			if (vgap.plugins["enemyShipListPlugin"].mobile_version) {
				vgap.plugins["enemyShipListPlugin"].showSelectionTool();
				vgap.map.draw();
			} else {
				this.showOverlayFilter();
			}
		},

		/**
				 * Show the panel for selecting which player to show the ship locations for
				 */
		showOverlayFilter: function () {

			var html = "<div id='OverlayFilter'><table>";

			for (var p = 0; p < vgap.plugins["enemyShipListPlugin"].drawSelection.length; p++) {

				var name = "All";

				if (p > 0) {
					for (var i = 0; i < vgap.players.length; i++) {
						if (vgap.players[i].id == p) {
							name = vgap.players[i].fullname;
						}
					}
				}
				var check_text = "";
				if (vgap.plugins["enemyShipListPlugin"].drawSelection[p]) {
					check_text = " checked";
				}
				html += "<tr><td><input type='checkbox' " + check_text + " onchange='vgap.plugins[\"enemyShipListPlugin\"].toggleSelection(" + p + "); vgap.map.draw(); '></input></td><td>" + name + "</td></tr>";
			}
			html += "</table></div>";
			//$("#PlanetsMenu").append(html);

			var inMore = vgap.planetScreenOpen || vgap.shipScreenOpen || vgap.starbaseScreenOpen;
			if (inMore) {
				html = "<h1>Show ship locations for:</h1>" + html;
				html += "<a class='MoreBack' onclick='vgap.closeMore();vgap.more.empty();return false;'>OK</a>";
				vgap.more.empty();
				$(html).appendTo(vgap.more);

				$("#OverlayFilter").height($(window).height() - 100);
				vgap.showMore(300);
			}
			else {
				html = "<div class='TitleBar'><div class='CloseScreen' onclick='vgap.closeLeft();vgap.lc.empty();'></div><div class='TopTitle'>Show ship locations for:</div></div>" + html;
				vgap.lc.empty();
				$(html).appendTo(vgap.lc);
				vgap.openLeft();
				$("#OverlayFilter").height($(window).height() - 40);
				$("#OverlayFilter").width(380);
			}
			$("<div style='margin-bottom:10px;'></div>")
				.append(vgap.plugins["enemyShipListPlugin"].buildTurnRangeControl())
				.append($("<div style='margin-top:10px;'>Only show ship: </div>").append(vgap.plugins["enemyShipListPlugin"].buildShipFilterSelect()))
				.prependTo("#OverlayFilter");
			$("#OverlayFilter").jScrollPane();
		},

		toggleSelectionTool: function () {
			if (vgap.plugins["enemyShipListPlugin"].menuactive) {
				$("#EnemyShipTool").remove();
				vgap.plugins["enemyShipListPlugin"].menuactive = false;
			}
			else {
				vgap.plugins["enemyShipListPlugin"].showSelectionTool();
				vgap.plugins["enemyShipListPlugin"].menuactive = true;
			}
		},

		showSelectionTool: function () {
			$("#EnemyShipTool").remove();
			$("<div id='EnemyShipTool' " + "></div>").appendTo("#MapControls");
			vgap.map.addMapTool("Close Enemy Ship Menu", "enemymenuhide", function () { vgap.plugins["enemyShipListPlugin"].toggleSelectionTool(); }, "#EnemyShipTool")
			vgap.map.addMapTool("Filter To Ship", "enemyshipfilter" + (this.showShipFilter ? " activeColor" : ""), function () { vgap.plugins["enemyShipListPlugin"].toggleShipFilter(); }, "#EnemyShipTool")
			for (var i = this.drawSelection.length - 1; i > 0; i--) {
				// if (i == vgap.player.id) {
				// 	continue;
				// }
				vgap.map.addMapTool(this.getPlayerTooltip(i), "race" + i.toString() + (this.drawSelection[i] ? "enabled" : "") + this.getRelationClass(i) + (this.isPlayerDead(i) ? " playerdead" : ""), vgap.plugins["enemyShipListPlugin"].toggleSelectionHelper.bind(i), "#EnemyShipTool");
			}
			vgap.map.addMapTool("All ships", "allships" + (this.drawSelection[0] ? "enabled" : ""), function () { vgap.plugins["enemyShipListPlugin"].toggleSelection(0) }, "#EnemyShipTool");
			$("<div style='clear:both; float:right; margin-right:10px; padding:4px; background:rgba(0,0,0,0.6); color:#FFFFFF;'></div>").append(this.buildTurnRangeControl()).appendTo("#EnemyShipTool");
			if (this.showShipFilter) {
				$("<div style='clear:both; float:right; margin-right:10px;'></div>").append(this.buildShipFilterSelect()).appendTo("#EnemyShipTool");
			}
		},

		/**
		 * Hover text for a player slot button: player name, race and relation
		 * @param id	player slot
		 * @return 		text safe to put in a single quoted title attribute
		 */
		getPlayerTooltip: function (id) {
			var player = vgap.getPlayer(id);
			if (!player)
				return "Slot " + id;

			var race = vgap.getRace(player.raceid);
			var relation = "";
			if (id == vgap.player.id) {
				relation = "You";
			} else if (this.getRelationClass(id) == " relally") {
				relation = "Full alliance";
			} else if (this.getRelationClass(id) == " relenemy") {
				relation = "No alliance";
			} else {
				relation = "Safe passage / shared intel";
			}

			if (this.isPlayerDead(id))
				relation = "Dead, " + relation;

			var text = "Slot " + id + ": " + player.username + " - " + (race ? race.name : "?") + " (" + relation + ")";
			return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/'/g, "&#39;");
		},

		/**
		 * Check if a player has been eliminated: NU player status 3 (dead), or nothing left on the scoreboard
		 * @param id	player slot
		 * @return 		true if the player is dead
		 */
		isPlayerDead: function (id) {
			var player = vgap.getPlayer(id);
			if (!player)
				return false;
			if (player.status == 3)
				return true;
			for (var i = 0; i < vgap.scores.length; i++) {
				var score = vgap.scores[i];
				if (score.ownerid == id) {
					return score.planets == 0 && score.capitalships == 0 && score.freighters == 0 && score.starbases == 0;
				}
			}
			return false;
		},

		/**
		 * CSS class marking a player's relation to us: yellow for ourselves, green for full alliance,
		 * red for no alliance, none for safe passage / shared intel (keeps the normal colour)
		 * @param id	player slot
		 * @return 		class name with leading space, or empty string
		 */
		getRelationClass: function (id) {
			if (id == vgap.player.id)
				return " relself";
			if (vgap.fullallied(id))
				return " relally";
			var relation = vgap.getRelation(id);
			if (relation == null || (relation.relationto < 2 && relation.relationfrom < 2))
				return " relenemy";
			return "";
		},

		/**
		 * Show or hide the single ship filter dropdown. Hiding it also clears the filter.
		 */
		toggleShipFilter: function () {
			var plugin = vgap.plugins["enemyShipListPlugin"];
			plugin.showShipFilter = !plugin.showShipFilter;
			if (!plugin.showShipFilter && plugin.shipFilterId) {
				plugin.shipFilterId = 0;
				vgap.map.draw();
			}
			plugin.showSelectionTool();
		},

		/**
		 * Get the enemy ships available for the single ship filter, ordered by the
		 * turn they were last seen (most recent first) and then by ship id
		 * @return      sorted list of ships
		 */
		getShipFilterShips: function () {
			var range = this.getTurnRange();
			var ships = [];
			for (var s = 0; s < this.enemyShipList.length; s++) {
				var ship = this.enemyShipList[s];
				if (ship.ownerid == vgap.player.id)
					continue;
				if (!this.isOwnerSelected(ship.ownerid))
					continue;
				//ignore info from future turns in case of history
				if (vgap.game.turn < ship.infoturn)
					continue;
				//only ships seen within the turn range; last seen = latest sighting in range
				var sightings = this.getSightingsInRange(ship, range);
				if (sightings.length == 0)
					continue;
				ships.push({ ship: ship, lastSeen: sightings[sightings.length - 1].turn });
			}
			ships.sort(function (a, b) {
				return (b.lastSeen - a.lastSeen) || (parseInt(a.ship.id, 10) - parseInt(b.ship.id, 10));
			});
			return ships;
		},

		/**
		 * Build the dropdown for filtering the starmap down to a single ship
		 * @return      jQuery select element
		 */
		buildShipFilterSelect: function () {
			var plugin = vgap.plugins["enemyShipListPlugin"];
			var select = $("<select id='EnemyShipFilterSelect'></select>");
			$("<option value='0'></option>").text("-- No ship filter --").appendTo(select);

			var ships = plugin.getShipFilterShips();
			for (var s = 0; s < ships.length; s++) {
				var ship = ships[s].ship;
				var player = vgap.getPlayer(ship.ownerid);
				var race = player ? vgap.getRace(player.raceid).shortname : "?";
				$("<option></option>")
					.val(ship.id)
					.text("Turn " + ships[s].lastSeen + " - #" + ship.id + " " + ship.name + " (" + race + ")")
					.prop("selected", ship.id == plugin.shipFilterId)
					.appendTo(select);
			}

			select.change(function () { plugin.setShipFilter(parseInt($(this).val(), 10)); });
			//keep clicks on the dropdown from reaching the starmap
			select.on("mousedown click touchstart", function (e) { e.stopPropagation(); });
			return select;
		},

		/**
		 * Restrict the starmap display to a single ship and center on it
		 * @param id	id of ship to show, 0 to clear the filter
		 */
		setShipFilter: function (id) {
			this.shipFilterId = id || 0;
			var ship = this.getShipById(this.shipFilterId);
			if (ship) {
				var sightings = this.getSightingsInRange(ship, this.getTurnRange());
				var last = sightings.length > 0 ? sightings[sightings.length - 1] : ship;
				vgap.map.centerMap(last.x, last.y);
			}
			vgap.map.draw();
		},

		/**
		 * Check if a player's ships are selected for display. With no player selected, all players count as selected
		 * @param ownerid	player id
		 * @return 			true if the player's ships belong in the ship filter
		 */
		isOwnerSelected: function (ownerid) {
			var selection = vgap.plugins["enemyShipListPlugin"].drawSelection;
			if (selection[0] || selection[ownerid])
				return true;
			for (var p = 1; p < selection.length; p++) {
				if (selection[p])
					return false;
			}
			return true;
		},

		getShipById: function (id) {
			if (!id)
				return null;
			for (var s = 0; s < this.enemyShipList.length; s++) {
				if (this.enemyShipList[s].id == id) {
					return this.enemyShipList[s];
				}
			}
			return null;
		},

		/**
					 * Retrieve all ships within 'drawRadius' from x,y coordinate
					 * @param x		x-coordinate
		 * @param y		y-coordinate
		 * @return      list of ships within radius from x,y
						   */
		shipsAt: function (x, y) {
			var ships = [];
			var range = vgap.plugins["enemyShipListPlugin"].getTurnRange();

			for (var es = 0; es < vgap.plugins["enemyShipListPlugin"].enemyShipList.length; es++) {
				var ship = vgap.plugins["enemyShipListPlugin"].enemyShipList[es];

				var filterId = vgap.plugins["enemyShipListPlugin"].shipFilterId;
				var selected = filterId ? (ship.id == filterId) : (vgap.plugins["enemyShipListPlugin"].drawSelection[0] || vgap.plugins["enemyShipListPlugin"].drawSelection[ship.ownerid]);
				if (!selected || ship.visible)
					continue;

				//use the position the marker is drawn at: last sighting within the turn range
				var sightings = vgap.plugins["enemyShipListPlugin"].getSightingsInRange(ship, range);
				if (sightings.length == 0)
					continue;
				var last = sightings[sightings.length - 1];

				if (Math.dist(x, y, last.x, last.y) <= vgap.plugins["enemyShipListPlugin"].drawRadius) {
					ships.push(ship);
				}
			}
			return ships;
		},


		/**
					 * Produce html for hover info for a ship
					 * @param ship   ship
			   * @return       html text for hover text
					 */
		hitTextBox: function (ship) {
			var player = vgap.getPlayer(ship.ownerid);
			var hull = vgap.getHull(ship.hullid);
			var race = vgap.getRace(player.raceid);

			//ignore info from future turns in case of history
			if (vgap.game.turn <= ship.infoturn)
				return "";

			var d = "<div class='ItemSelectionBox minCorrection' style='color:#F39512'>";
			d += "<table class='CleanTable'>";
			d += "<tr><td colspan='2'>" + ship.id + ": " + ship.name + "</td></tr>";
			d += "<tr><td colspan='2'>" + hull.name + "</td></tr>";
			//d += "<tr><td>Heading:</td><td>&nbsp;" + gsv(m.heading) + " at Warp: " + gsv(m.warp) + "</td></tr>";
			//d += "<tr><td>Mass: </td><td>&nbsp;" + gsv(m.mass) + "</td></tr>";
			d += "<tr><td>Seen:</td><td>" + (vgap.game.turn - ship.infoturn) + " turns ago";
			d += "<tr><td colspan='2'>" + race.name + " (" + player.username + ")</td></tr>";
			d += "</table>";
			d += "</div>";

			return d;
		}


	}; //end enemyShipListPlugin

	// register your plugin with NU
	vgap.registerPlugin(enemyShipListPlugin, "enemyShipListPlugin");


	vgap.plugins["enemyShipListPlugin"].oldClearTools = vgapMap.prototype.clearTools;

	vgapMap.prototype.clearTools = function (result) {

		for (var p = 0; p < vgap.plugins["enemyShipListPlugin"].drawSelection.length; p++) {
			vgap.plugins["enemyShipListPlugin"].drawSelection[p] = false;
		}
		vgap.plugins["enemyShipListPlugin"].menuactive = false;
		vgap.plugins["enemyShipListPlugin"].shipFilterId = 0;
		vgap.plugins["enemyShipListPlugin"].showShipFilter = false;
		vgap.plugins["enemyShipListPlugin"].turnFrom = null;
		vgap.plugins["enemyShipListPlugin"].turnTo = 0;
		$("#EnemyShipTool").remove();


		//execute the normal clearTools function
		vgap.plugins["enemyShipListPlugin"].oldClearTools.apply(this, arguments);

	};



	/**
	 * Overload the processLoadHistory function in order to be able to
	 * automatically iterate through many turns.
	 */
	//var oldProcessLoadHistory = vgaPlanets.prototype.processLoadHistory;
	vgap.plugins["enemyShipListPlugin"].oldProcessLoadHistory = vgaPlanets.prototype.processLoadHistory;

	vgaPlanets.prototype.processLoadHistory = function (result) {


		//execute the normal processLoadHistory function
		vgap.plugins["enemyShipListPlugin"].oldProcessLoadHistory.apply(this, arguments);

		//check if we are in the process of reading in all past turns

		if (vgap.plugins["enemyShipListPlugin"].processAllTurns) {

			if (!result.success) {
				console.log("EnemyShipListPlugin: The desired turn could not be loaded. Aborting ship list read in.");

				//after failed load resetRequest should always be false.
				vgap.plugins["enemyShipListPlugin"].resetRequest = false;
				vgap.plugins["enemyShipListPlugin"].processAllTurns = false;
				return;
			}

			if (vgap.plugins["enemyShipListPlugin"].currentListTurn < vgap.nowTurn) {
				// not done processing: load next turn
				console.log("EnemyShipListPlugin: Processing... Loading next turn: " + (vgap.plugins["enemyShipListPlugin"].currentListTurn + 1) + " / " + vgap.nowTurn + ".");

				if (vgap.plugins["enemyShipListPlugin"].currentListTurn + 1 == vgap.nowTurn) {
					vgap.loadNow();
				} else {
					vgap.loadHistory(vgap.plugins["enemyShipListPlugin"].currentListTurn + 1);
				}
			} else {
				// done processing: clear flag
				vgap.plugins["enemyShipListPlugin"].processAllTurns = false;

				console.log("EnemyShipListPlugin: Done processing.");
			}
		}

	};

	vgap.plugins["enemyShipListPlugin"].oldShowInfo = vgapMap.prototype.showInfo;


	/**
	 * Overload showInfo to display enemy ships in infobox.
	 */
	vgapMap.prototype.showInfo = function (clientX, clientY) {

		//execute the normal showInfo function
		vgap.plugins["enemyShipListPlugin"].oldShowInfo.apply(this, arguments);

		if (!vgap.plugins["enemyShipListPlugin"].mobile_version) {
			var info_box_parent = vgap.map.loc.children()[0];
			var first_entry = info_box_parent.childNodes[0];

			var x = Math.round(vgap.map.mapX(clientX));
			var y = Math.round(vgap.map.mapY(clientY));

			var es = vgap.plugins["enemyShipListPlugin"].shipsAt(x, y);

			for (var d = es.length - 1; d >= 0; d--) {
				// insert ships right after coordinates (inserted in reverse order, then displayed in correct order)
				$(vgap.plugins["enemyShipListPlugin"].hitTextBox(es[d])).insertAfter(first_entry);
			}
		} else {
			//TODO: this needs to be adjusted once the showInfo is properly used by the mobile client
		}

	};




	/**
	 * Helper functions: get the number of capitalships, freighters, bases, or planets for a
	 * specific player.
	 * @param: id   player id
	 * @param: type string for requested number ("capitalships", "freighters", "planets", "starbases")
	 * @return: number from scoreboard
	 */
	getNumForPlayer = function (id, type) {

		for (var i = 0; i < vgap.scores.length; i++) {
			if (vgap.scores[i].ownerid == id) {
				if (type == "capitalships") {
					return vgap.scores[i].capitalships;
				} else if (type == "freighters") {
					return vgap.scores[i].freighters;
				} else if (type == "starbases") {
					return vgap.scores[i].starbases;
				} else if (type == "planets") {
					return vgap.scores[i].planets;
				}
				console.log("Type incorrect!");
				return 0;
			}
		}
		console.log("Player not found in scores!");
		return 0;
	};



} //wrapper for injection

var script = document.createElement("script");
script.type = "application/javascript";
script.textContent = "(" + wrapper + ")();";

document.body.appendChild(script);
document.body.removeChild(script);
