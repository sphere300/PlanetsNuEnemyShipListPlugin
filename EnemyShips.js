// ==UserScript==
// @name          Planets.nu - Enemy Ship List Plugin
// @namespace     kedalion/enemyShipList
// @version       1.41
// @date          2026-10-24
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
1.41   Added a 'Build Predictor' tab. Records the scoreboard every turn and shows per player the changes in score, military score, warships and freighters, with the ships first seen each turn and a summary of the player's known and missing ships. A build estimate lists ship configurations that could explain a turn's military score change, tuned on complete games: it follows each race's usual fighters, sweepers and scouts in each phase of the game (opening, early, close to the ship limit), shows the starbase builds (starbase fighters, defense posts, loaded ammo) that make up the rest of the change, shows the starting build on turn 2 and lists every player's starting freighter until it is seen, lists the 5 likeliest configurations, none worth more than 1.25 times the military change, above a table of how often the estimate was right on complete games with the model version it was measured on, lets a configuration be stored as the predicted build, listed and counted with the ships seen but marked as predicted until a matching ship is seen, and stops at the ship limit (the manual build, which also takes starbase builds, still works). A manual build can be stored as a custom predicted build.
1.40  Added a new feature to see the historical movement of enemy ships. You can filter by all, by player, or by ship. You can show the path range for specific time windows and fixed one issue with the origonal plugins icon
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

	var plugin_version = 1.41;

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
		//builds chosen in the build predictor: ship entries like the list's, without id or position, marked predicted,
		//with the build turn (predictedTurn) and the last list turn when they were chosen (storedListTurn)
		predictedShips: [],
		scoreHistory: {},	//turn -> ownerid -> {c: capital ships, f: freighters, m: military score, s: score, and their changes from the turn before: dc, df, dm, ds}
		mineHistory: {},	//turn -> minefield id -> [ownerid, units] of the minefields seen in the turn
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
		scoreVisibleTurns: 15,	//rows visible in the build predictor score table before it scrolls
		estimateTurn: null,		//turn shown in the build estimate, null = latest turn with new warships
		estimateResults: 5,		//configurations listed in the build estimate
		estimateClosestResults: 100,	//configurations returned by closeness to the military change (used by the tuning scripts)
		//build estimate tuning, fitted on complete games
		estimateSearchWidth: 200,		//partial ship sets kept per step of the search
		estimateMaxOver: 1.25,			//most a listed set may be worth, as a multiple of the military change
		estimateRaceHullWeight: 0.5,	//weight of a race hull never seen in the player's fleet; each seen ship adds 1
		estimateFreshWeight: 8,			//weight added per ship first seen in the build turn or the next
		estimateFreshTurns: 2,			//turns after the build in which a first sighting counts as fresh
		estimateOpeningFill: 0.25,		//fraction of the ship limit in use below which a build counts as the opening
		//military score every player starts with (starbase with 100 defense and 20 fighters, homeworld with about 20 defense posts),
		//next to one Medium Deep Space Freighter with Transwarp engines. The turn 1 scoreboard shows 0 instead, so the turn 2
		//change would count them as built.
		startMilitary: 2110,
		//minefields count 0.27 military points per mine unit (complete games: every race), and lose 5% of their units a turn.
		//Laying mines uses up torpedoes, which counted as ammo: each makes torpedo id squared units, four times that for the Robots.
		mineValue: 0.27,
		mineDecay: 0.05,
		estimateEarlyFill: 0.5,			//fraction of the ship limit in use below which a build counts as early game
		//how players build in each phase of the game, by how full the ship limit is. In the opening players build scouts and
		//small cheap warships, then more and bigger warships, and close to the limit they trade minerals for strength.
		//Once the limit is hit builds are not estimated automatically (only by the manual build).
		//	hullSlope, beamSlope, torpedoSlope: favor costly / high tech (> 0) or cheap / low tech (< 0) parts
		//	bestEngine, cheapEngine: weight added to the best and the cheapest engine
		//	seenWeight: how strongly components seen in the fleet are preferred
		//	focusWeight: ships' worth of weight the race's usual builds (estimateRaceFocus) add to the hulls
		//	focusOutfit: share of a hull's likelihood given to the outfits the race usually puts on it
		//	outfitWeight: how strongly a less likely outfit counts against a ship, next to its hull
		//	fitWeight: how strongly the fit to the military change counts against the likelihood of the ships
		//	fit: how often the ships built are worth each fraction of the military change (estimateFitEdges), the rest
		//		goes to ammo, defense and minefields
		estimatePhases: {
			opening: { name: "opening", hullSlope: 1, beamSlope: -3, torpedoSlope: -3, bestEngine: 8, cheapEngine: 1, seenWeight: 8, focusWeight: 10, focusOutfit: 0.5, outfitWeight: 0.5, fitWeight: 0.5,
				fit: [0.01, 0.02, 0.02, 0.01, 0.03, 0.04, 0.03, 0.06, 0.07, 0.07, 0.13, 0.5, 0.001, 0.001, 0.01, 0.001] },
			early: { name: "early game", hullSlope: 0, beamSlope: -3, torpedoSlope: -3, bestEngine: 4, cheapEngine: 3, seenWeight: 3, focusWeight: 20, focusOutfit: 0.5, outfitWeight: 0.5, fitWeight: 0.75,
				fit: [0.01, 0.02, 0.04, 0.03, 0.05, 0.05, 0.08, 0.07, 0.15, 0.1, 0.18, 0.18, 0.01, 0.01, 0.02, 0.01] },
			nearCap: { name: "close to the ship limit", hullSlope: 1, beamSlope: -3, torpedoSlope: -2, bestEngine: 8, cheapEngine: 0, seenWeight: 3, focusWeight: 5, focusOutfit: 0.75, outfitWeight: 0.5, fitWeight: 0.5,
				fit: [0.01, 0.02, 0.04, 0.04, 0.04, 0.06, 0.08, 0.12, 0.13, 0.11, 0.15, 0.06, 0.04, 0.03, 0.03, 0.02] },
			afterCap: { name: "ship limit reached", hullSlope: 1, beamSlope: 1, torpedoSlope: 2, bestEngine: 8, cheapEngine: 3, seenWeight: 3, focusWeight: 0, focusOutfit: 0, outfitWeight: 1, fitWeight: 1,
				fit: [0.05, 0.07, 0.08, 0.11, 0.1, 0.1, 0.09, 0.07, 0.07, 0.03, 0.04, 0.04, 0.01, 0.01, 0.04, 0.03] }
		},
		estimateFitEdges: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95, 1.0, 1.02, 1.05, 1.1, 1.25, 1.5],
		estimateFitFloor: 0.002,		//likelihood density of a fraction outside estimateFitEdges
		//confidence in the listed builds, fitted on complete games (tools/confidence.js): how often the hulls built are among
		//the listed builds, by phase, by whether a warship of the player was seen by the build turn or the turn after, and by
		//warships built (1, 2, 3 or more); and how fast the share of a listed build falls with its score behind the best one
		estimateListed: {
			opening: { seen: [0.97, 0.73, 0.53], unseen: [0.97, 0.7, 0.59] },
			early: { seen: [0.93, 0.61, 0.34], unseen: [0.95, 0.7, 0.41] },
			nearCap: { seen: [0.87, 0.52, 0.23], unseen: [0.86, 0.53, 0.23] },
			afterCap: { seen: [0.87, 0.52, 0.23], unseen: [0.86, 0.53, 0.23] }
		},
		estimateConfidenceSpread: 0.94,
		//ranks the sets the search keeps: LightGBM LambdaMART trees learned on complete games (tools/rank.py, written by
		//tools/writeranker.py). The score of a set is the sum of a leaf of each tree. Each tree is [nodes, leaves], nodes holding four
		//numbers each: feature (index in the features), threshold, and the next node for at most and above the threshold, a child
		//below 0 being leaf ~child. null ranks by the score of the search.
		estimateRanker: {"trees":[[[21,0.0375,1,4,31,0.9444444,2,3,27,0.45,-1,-2,7,2.5,-3,-4,15,-3.38828,5,11,31,0.9444444,6,10,7,1.5,7,-9,9,3.851695,8,-8,12,0.9264041,-5,9,34,140.125,-6,-7,3,1.5,-10,-11,8,1.604726,-12,12,25,-0.8613833,-13,13,9,1.768283,-14,-15],[-0.092954,-0.067611,0.068575,0.018819,0.041023,0.025331,-0.025453,-0.029197,-0.052827,0.066304,0.017302,0.090458,0.067012,0.04713,-0.010698]],[[8,3.060663,1,4,8,1.604726,2,3,13,1e-35,-1,-2,16,0.6333333,-3,-4,24,-3.365408,5,6,21,0.0225,-5,-6,18,0.7638889,7,8,21,1e-35,-7,-8,4,1801.528,9,10,32,0.1339744,-9,-10,33,3236.167,11,-15,34,67.16667,-11,12,4,6213.5,13,-14,15,-3.365566,-12,-13],[0.094395,0.055906,-0.035114,0.031127,-0.082674,-0.041184,-0.033237,0.023437,0.038726,-0.024484,-0.053013,-0.028106,-0.0013037,-0.04167,0.0099989]],[[10,0.1051316,1,5,8,2.027052,2,3,8,1.252309,-1,-2,25,-0.9076405,-3,4,10,0.02006711,-4,-5,24,-3.347722,6,8,26,0.02325,-6,7,9,3.92069,-7,-8,9,3.015892,9,12,4,1288.5,10,11,23,2.5,-9,-10,18,0.4142857,-11,-12,19,0.3693182,13,-15,9,4.027897,-13,-14],[0.071525,0.04618,0.036597,0.02138,-0.0045355,-0.07985,-0.019105,-0.072042,0.045644,-0.0071598,0.042601,-0.0071153,-0.034192,-0.059166,-0.0069151]],[[9,2.910147,1,10,8,2.027052,2,4,13,1e-35,-1,3,20,-1.878601,-2,-3,27,0.45,5,6,20,-2.808196,-4,-5,8,3.060663,7,8,25,-1.246704,-6,-7,14,529.5,9,-10,4,1489.5,-8,-9,20,-2.903559,-11,11,4,1077.0,12,13,37,1.916667,-12,-13,31,0.55,-14,-15],[0.084321,0.012281,0.050007,-0.064626,-0.0085544,0.037673,0.014297,0.044181,-0.01032,-0.0019907,-0.071623,0.031939,-0.072657,-0.047545,-0.0156]],[[10,0.1051316,1,7,10,0.01002513,2,4,16,0.9,-1,3,12,0.456454,-2,-3,25,-0.9430491,-4,5,31,0.9444444,6,-7,6,14.5,-5,-6,26,0.01925,8,9,19,0.0655914,-8,-9,18,0.9444444,10,12,31,0.9444444,11,-12,6,16.5,-10,-11,14,529.5,13,-15,10,0.2402186,-13,-14],[-0.0014063,0.019575,0.05358,0.032464,-0.0015783,-0.050743,0.01963,-0.072909,-0.016219,-0.0021574,-0.050348,0.015223,0.029242,-0.023142,-0.034566]],[[8,3.526857,1,7,8,1.848594,2,3,13,1e-35,-1,-2,16,0.6333333,-3,4,20,-1.973402,5,6,13,1e-35,-4,-5,13,0.5794401,-6,-7,24,-3.347722,-8,8,50,0.8166667,9,12,4,1489.5,10,11,20,-2.260635,-9,-10,13,0.4838711,-11,-12,33,3373.3,13,-15,19,0.3693182,-13,-14],[0.077658,0.045417,-0.018274,0.073645,-0.0016333,0.031257,0.002383,-0.066683,-0.018232,0.040242,0.0046564,-0.037515,-0.035836,-0.010834,-0.002508]],[[10,0.1051316,1,9,10,0.01002513,2,6,3,1.5,3,-5,12,0.3325161,-1,4,12,1.000001,5,-4,12,0.9952772,-2,-3,20,-1.878601,7,8,9,1.621006,-6,-7,25,-0.9430491,-8,-9,9,2.985941,10,13,27,0.45,-10,11,14,529.5,-11,12,18,0.9444444,-12,-13,20,-3.07476,-14,-15],[0.0078406,0.045201,0.073354,0.024107,0.015307,0.010086,-0.028605,0.032698,0.013056,-0.054572,0.01974,0.00063598,-0.018103,-0.066129,-0.036942]],[[10,0.1051316,1,9,8,2.027052,2,3,8,1.252309,-1,-2,25,-1.246704,4,5,11,-0.7550033,-3,-4,12,0.4482828,6,7,5,8.5,-5,-6,27,0.45,-7,8,16,0.55,-8,-9,24,-3.347722,-10,10,18,0.9444444,-11,11,4,1874.5,12,13,22,0.1464286,-12,-13,33,3905.333,-14,-15],[0.056599,0.035293,-0.0096065,0.032041,-0.02388,0.0077214,-0.031732,-0.0092713,0.017387,-0.063026,-0.0021798,0.015293,-0.026312,-0.037262,-0.007213]],[[10,0.1051316,1,7,8,1.848594,2,4,13,1e-35,-1,3,15,-2.42807,-2,-3,25,-0.3390494,5,6,12,1.000001,-4,-5,28,0.1870833,-6,-7,24,-3.347722,-8,8,19,0.3484848,9,13,6,8.5,10,12,14,3846.5,11,-11,14,529.5,-9,-10,31,0.9444444,-12,-13,21,0.2655,-14,-15],[0.070584,0.011018,0.042402,0.025467,0.0017111,-0.0033243,0.01976,-0.061406,-0.0042953,-0.029227,0.013347,-0.04927,-0.017433,0.0039887,-0.028131]],[[9,2.817411,1,10,15,-3.043173,2,5,26,1e-35,-1,3,13,1e-35,-2,4,50,0.5357143,-3,-4,11,0.3628258,6,9,13,1e-35,-5,7,20,-1.69949,-6,8,16,0.6333333,-7,-8,31,0.9444444,-9,-10,20,-2.662637,11,12,26,0.01925,-11,-12,37,0.45,13,-15,12,0.2156542,-13,-14],[-0.045136,0.068619,0.011924,-0.0037031,0.068851,0.016816,0.0047699,0.041516,-0.011884,0.01852,-0.06425,-0.046265,-0.036812,0.0080566,-0.028885]],[[10,0.1051316,1,9,13,1e-35,-1,2,24,-1.876648,3,4,9,1.726175,-2,-3,3,1.5,5,-9,13,0.6162465,6,-8,39,3.775,7,-7,37,1.916667,-4,8,6,2.5,-5,-6,9,2.985941,10,13,27,0.55,-10,11,18,0.6333333,12,-13,31,0.6333333,-11,-12,24,-3.079087,-14,-15],[0.066286,0.0070403,-0.033647,0.039853,-0.03397,0.011993,0.039082,0.0083485,0.0077933,-0.043466,-0.0076931,0.022371,-0.010711,-0.059609,-0.033973]],[[9,2.817411,1,10,8,2.554887,2,5,13,1e-35,-1,3,20,-2.189327,-2,4,13,0.5794401,-3,-4,27,0.7083333,6,7,19,0.4083333,-5,-6,25,-1.246704,-7,8,13,0.5405242,-8,9,38,0.2916667,-9,-10,20,-2.662637,11,12,27,0.6333333,-11,-12,4,1077.0,-13,13,19,0.0750469,-14,-15],[0.065359,-0.0010771,0.034688,0.010057,-0.047085,0.0032063,0.013455,0.0050967,-0.025946,0.011789,-0.06235,-0.045282,0.019967,-0.037042,-0.010501]],[[9,2.743388,1,11,8,2.554887,2,6,13,1e-35,-1,3,16,0.6333333,-2,4,24,-1.604705,5,-5,11,-1.285069,-3,-4,27,0.7083333,7,8,31,0.775,-6,-7,16,0.55,-8,9,31,0.7083333,10,-11,6,9.5,-9,-10,24,-2.652488,-12,12,4,1101.5,-13,13,31,0.9444444,-14,-15],[0.063775,-0.0024742,-0.023176,0.020194,0.035297,-0.048267,-0.0027146,-0.015593,0.0059836,-0.03327,0.018698,-0.053952,0.015305,-0.034318,-0.0076074]],[[9,2.743388,1,10,8,2.554887,2,5,8,1.252309,-1,3,16,0.6333333,-2,4,12,0.3325161,-3,-4,21,1e-35,6,7,19,0.4833333,-5,-6,16,0.55,-7,8,19,0.4365079,9,-10,30,1.583333,-8,-9,20,-2.903559,-11,11,20,-2.058361,-12,12,37,0.9444444,-13,13,8,3.060663,-14,-15],[0.04692,-0.0065563,0.0012139,0.028911,-0.042888,0.0033896,-0.01232,0.0055954,-0.010645,0.016857,-0.054301,-0.032567,0.008723,0.032279,-0.024435]],[[9,2.728198,1,9,8,2.554887,2,5,13,1e-35,-1,3,20,-1.69949,-2,4,13,0.5528765,-3,-4,24,-3.347722,6,7,21,0.0225,-5,-6,12,0.3272304,8,-9,4,1773.0,-7,-8,20,-2.147399,10,12,21,0.0215,-10,11,9,4.065118,-11,-12,4,965.5,-13,13,8,3.060663,-14,-15],[0.061663,0.010175,0.03289,0.0090707,-0.048339,0.0068925,0.029833,-0.018588,0.0054274,-0.057701,-0.024482,-0.050292,0.027131,0.02503,-0.019945]],[[9,2.728198,1,9,8,2.554887,2,7,13,1e-35,-1,3,24,-1.876648,-2,4,16,0.6333333,-3,5,13,0.5794401,6,-6,24,-1.206373,-4,-5,27,0.55,8,-9,20,-3.319165,-7,-8,20,-2.147399,10,12,21,0.0215,-10,11,9,4.083376,-11,-12,4,965.5,-13,13,8,3.060663,-14,-15],[0.060573,0.0038231,0.00012685,0.024935,0.038506,0.0070033,-0.049363,-0.0056148,0.0035154,-0.056733,-0.024419,-0.049351,0.025297,0.024228,-0.019243]],[[10,0.1051316,1,11,8,1.604726,2,3,13,1e-35,-1,-2,20,-1.916581,4,6,9,1.2632,5,-5,13,1e-35,-3,-4,0,0.2268889,-6,7,31,0.9444444,8,10,7,1.5,9,-9,13,0.5756708,-7,-8,16,0.9,-10,-11,24,-3.347722,-12,12,9,3.015892,-13,13,31,0.9444444,-14,-15],[0.060685,0.032324,0.058751,0.0074148,-0.019399,0.028955,0.010022,-0.027729,-0.053655,-0.0018826,0.023245,-0.052184,-0.0062758,-0.035809,-0.012176]],[[10,0.1051316,1,12,8,1.604726,2,3,13,1e-35,-1,-2,20,-1.973402,4,6,13,1e-35,-3,5,26,0.01925,-4,-5,4,1147.5,7,8,37,1.916667,-6,-7,12,0.4734446,9,10,38,0.45,-8,-9,16,0.9,-10,11,39,3.775,-11,-12,24,-3.365408,-13,13,14,3929.5,-14,-15],[0.059934,0.031193,0.050195,-0.044661,0.0010608,0.043896,-0.056888,-0.0077434,0.028077,-0.00075273,0.0030546,0.026045,-0.051543,-0.021358,-0.0012515]],[[10,0.1051316,1,10,10,1e-35,2,4,12,1.000001,3,-3,12,0.9952772,-1,-2,20,-1.916581,5,6,9,1.621006,-4,-5,12,0.3852489,-6,7,33,608.75,-7,8,39,3.291667,9,-10,37,1.45,-8,-9,24,-3.347722,-11,11,9,3.491552,12,13,23,7.5,-12,-13,31,0.9444444,-14,-15],[0.032497,0.059973,0.010949,0.0059309,-0.026792,0.0024489,0.043513,0.02394,-0.019586,0.022311,-0.050592,-0.014481,0.00092643,-0.038226,-0.012395]],[[9,2.728198,1,11,8,2.027052,2,4,13,1e-35,-1,3,15,-2.42807,-2,-3,27,0.9444444,5,6,19,0.4833333,-4,-5,16,0.55,7,9,4,1833.28,-6,8,6,34.5,-7,-8,31,0.7083333,10,-11,6,9.5,-9,-10,20,-2.903559,-12,12,31,0.9444444,13,-15,4,965.5,-13,-14],[0.059072,0.0056219,0.029256,-0.038395,0.0056473,0.027549,-0.028796,0.0044939,0.0063052,-0.03154,0.018038,-0.049198,0.015974,-0.028669,-0.00082719]],[[10,0.1051316,1,10,8,1.252309,2,3,13,1e-35,-1,-2,20,-1.878601,4,6,13,1e-35,-3,5,9,1.726175,-4,-5,4,5602.055,7,8,41,0.7083333,-6,-7,23,7.5,9,-10,5,4.5,-8,-9,24,-3.365408,-11,11,9,2.559643,12,13,20,-1.055824,-12,-13,9,4.194136,-14,-15],[0.058878,0.034833,0.050432,0.0032912,-0.028382,0.02335,0.0064083,-0.047483,-0.010798,0.020526,-0.049489,-0.00070502,-0.031351,-0.018142,-0.03761]],[[10,0.1051316,1,9,8,1.252309,-1,2,20,-1.878601,3,4,9,1.2632,-2,-3,16,0.7083333,-4,5,12,0.3469746,6,-9,4,1773.0,-5,7,5,8.5,8,-8,6,9.5,-6,-7,24,-3.347722,-10,10,9,2.543776,-11,11,31,0.9444444,12,-15,6,8.5,13,-14,9,4.194136,-12,-13],[0.04018,0.0096585,-0.018079,-0.0039192,0.034476,-0.052529,0.0045701,0.0097256,0.021014,-0.048643,-0.0024301,-0.015237,-0.039359,-0.043315,-0.007365]],[[10,0.1051316,1,9,8,1.604726,2,3,13,1e-35,-1,-2,25,-0.3333564,4,7,12,1.000001,5,6,10,0.03510563,-3,-4,24,-2.652488,-5,-6,9,1.2632,8,-9,28,0.281,-7,-8,24,-3.347722,10,11,34,850.3333,-10,-11,9,2.543776,12,13,34,190.1667,-12,-13,9,4.194136,-14,-15],[0.058244,0.028169,0.02446,0.012554,-0.038986,0.0037348,0.0027017,0.026227,-0.021995,-0.048976,0.029971,-0.0087822,0.0071468,-0.016981,-0.035788]],[[10,0.1051316,1,7,8,1.252309,-1,2,8,2.751752,3,6,12,1.000001,4,-5,0,0.2452222,-2,5,19,0.2613636,-3,-4,33,608.75,-6,-7,20,-3.391161,8,9,14,5607.5,-8,-9,18,0.9444444,10,12,31,0.9444444,11,-12,6,15.5,-10,-11,9,4.194136,13,-15,25,-1.326157,-13,-14],[0.038118,0.030097,0.0039007,0.020186,-0.0013917,0.02313,0.00062723,-0.048257,0.0058453,0.0065712,-0.04064,0.013754,-0.0082889,-0.024718,-0.034531]],[[10,0.1051316,1,10,8,1.604726,2,3,8,-1e-35,-1,-2,20,-3.342644,4,5,21,0.0225,-3,-4,4,1239.5,6,7,22,0.4330357,-5,-6,25,-0.6250347,8,9,39,1.583333,-7,-8,9,1.2632,-9,-10,20,-3.391161,11,12,14,5607.5,-11,-12,9,2.543776,-13,13,19,0.0465368,-14,-15],[0.056569,0.029059,-0.050518,0.0080697,0.031619,-0.042626,-0.0077461,0.017872,0.0057206,-0.01789,-0.047626,0.0058981,-0.0018931,-0.026122,-0.0086333]],[[10,0.1051316,1,7,13,1e-35,-1,2,20,-1.878601,3,4,9,1.726175,-2,-3,8,1.848594,-4,5,25,-0.6365375,-5,6,4,1510.5,-6,-7,20,-3.391161,8,9,21,0.0215,-8,-9,18,0.9444444,10,12,31,0.9444444,11,-12,6,16.5,-10,-11,9,4.194136,13,-15,25,-1.326157,-13,-14],[0.054697,0.00097443,-0.027615,0.025267,0.016042,0.035667,0.00014151,-0.049682,-0.022725,0.0061136,-0.040808,0.012928,-0.0075418,-0.024058,-0.033074]],[[10,0.1051316,1,11,13,1e-35,-1,2,20,-1.878601,3,4,9,1.726175,-2,-3,16,0.7083333,-4,5,13,0.5528765,6,9,39,4.125,7,8,37,1.45,-5,-6,20,-1.319656,-7,-8,4,1773.0,-9,10,31,0.9444444,-10,-11,20,-3.45893,-12,12,18,0.9444444,-13,13,9,4.194136,-14,-15],[0.053877,0.00086692,-0.027293,-0.0052104,0.024533,-0.025052,0.016094,0.0308,0.030977,-0.036567,0.0039055,-0.044907,0.003248,-0.013279,-0.032707]],[[10,0.1051316,1,10,13,1e-35,-1,2,20,-1.878601,3,4,27,0.45,-2,-3,16,0.9,-4,5,12,0.4898603,6,9,34,376.125,7,-8,4,1773.0,-5,8,31,0.9444444,-6,-7,10,1e-35,-9,-10,27,0.45,-11,11,9,3.886507,12,13,34,190.1667,-12,-13,31,0.9444444,-14,-15],[0.052896,-0.043197,-0.0011853,-0.0038682,0.028336,-0.040867,-0.00083029,0.034194,0.032715,0.017345,-0.047653,-0.010927,0.0045383,-0.037388,-0.0036029]],[[9,2.713306,1,11,8,2.168662,2,4,13,1e-35,-1,3,20,-2.035795,-2,-3,31,0.9444444,5,7,6,9.5,6,-6,27,0.9444444,-4,-5,16,0.775,8,9,18,0.9444444,-7,-8,6,5.5,-9,10,19,0.5634921,-10,-11,20,-2.903559,-12,12,31,0.9444444,13,-15,6,5.5,-13,-14],[0.055178,-0.0087844,0.021419,-0.036715,0.0040123,-0.029493,0.0027776,-0.024574,0.0029418,0.013717,0.034717,-0.043693,-0.0093171,-0.035763,0.0031049]],[[10,0.1051316,1,10,8,1.252309,2,4,13,1e-35,-1,3,15,-2.144138,-2,-3,8,2.751752,5,8,12,1.000001,6,-7,13,0.3534728,-4,7,34,290.5833,-5,-6,50,0.5357143,9,-10,39,8.690476,-8,-9,27,0.45,-11,11,9,3.92069,12,13,34,190.1667,-12,-13,31,0.9444444,-14,-15],[0.056143,-0.0075278,0.031604,0.020055,-0.00087837,0.02979,-0.0038835,0.016394,-0.0072563,-0.0039007,-0.046671,-0.010435,0.0028593,-0.036278,-0.0035386]],[[20,-3.246901,1,3,21,0.0225,-1,2,14,5510.5,-2,-3,8,2.751752,4,8,13,1e-35,-4,5,20,-1.537967,-5,6,12,0.3325161,-6,7,15,-1.190579,-7,-8,31,0.9444444,9,-15,6,8.5,10,-14,12,0.1539572,-9,11,14,446.5,-10,12,40,0.2361111,-11,13,11,0.3628258,-12,-13],[-0.046942,-0.020034,0.021237,0.05492,0.0047952,-0.0025699,0.017864,0.034251,-0.034146,0.020037,-0.01323,0.010502,-0.015971,-0.032489,0.004604]],[[24,-3.158116,1,3,26,0.01925,-1,2,9,4.065118,-2,-3,8,2.751752,4,8,13,1e-35,-4,5,24,-1.374317,-5,6,16,0.6333333,-6,7,13,0.5528765,-7,-8,31,0.9444444,9,12,6,9.5,10,11,9,4.408405,-9,-10,7,1e-35,-11,-12,16,0.55,13,-15,6,34.5,-13,-14],[-0.047227,-0.0042149,-0.041603,0.054438,0.0055603,-0.0070689,0.026367,0.0047635,-0.0019091,-0.031285,0.001482,-0.037914,-0.028452,0.0083175,0.0087276]],[[9,2.910147,1,9,8,1.848594,2,4,13,1e-35,-1,3,15,-1.190579,-2,-3,21,1e-35,5,6,19,0.4083333,-4,-5,12,0.3272304,7,8,38,0.775,-6,-7,8,3.141945,-8,-9,21,0.0215,10,11,31,0.9444444,-10,-11,31,0.9444444,12,-15,9,4.978202,13,-14,6,8.5,-12,-13],[0.054706,0.013901,0.030346,-0.03387,-0.0015829,-0.016009,0.013553,0.0105,0.00097352,-0.048653,-0.009743,-0.010255,-0.035303,-0.044416,0.0053706]],[[24,-3.242406,1,2,21,0.0225,-1,-2,10,0.06012048,3,10,13,1e-35,-3,4,24,-1.31372,5,8,4,1461.0,6,7,37,1.291667,-4,-5,49,0.4166667,-6,-7,17,0.7321429,-8,9,13,0.6636236,-9,-10,31,0.9444444,11,-15,6,14.5,12,-14,14,3206.5,13,-13,6,4.5,-11,-12],[-0.04617,-0.015742,0.052998,0.029292,-0.048695,-0.0015447,0.024487,-0.006416,0.022343,-0.002214,-0.0079807,-0.030883,0.0084637,-0.03807,0.0030953]],[[24,-3.158116,1,3,26,0.01925,-1,2,9,4.065118,-2,-3,10,0.06012048,4,11,13,1e-35,-4,5,24,-1.374317,6,9,50,1e-35,-5,7,30,1.708333,-6,8,31,0.9444444,-7,-8,16,0.7083333,-9,10,13,0.6162465,-10,-11,31,0.9444444,12,13,30,3.708333,-12,-13,16,0.55,-14,-15],[-0.045773,-0.0043925,-0.040244,0.052456,0.016802,0.004953,-0.034086,0.0049705,-0.0040018,0.023306,0.00024657,-0.0080292,-0.036226,-0.020461,0.0071849]],[[24,-2.703887,1,3,21,0.0195,-1,2,9,2.068092,-2,-3,8,1.252309,4,5,13,1e-35,-4,-5,10,0.06012048,6,11,0,0.197,-6,7,31,0.9444444,8,9,6,9.5,-7,-8,6,3.5,-9,10,16,0.9,-10,-11,23,7.5,12,13,4,7172.388,-12,-13,19,0.9375,-14,-15],[-0.044625,0.0059868,-0.023816,0.054352,0.025003,0.019432,0.0035099,-0.03461,-0.0046326,-0.0022374,0.019761,-0.0045737,-0.025864,0.0017542,0.034008]],[[24,-2.703887,1,3,9,2.068092,-1,2,26,1e-35,-2,-3,8,1.848594,4,5,13,1e-35,-4,-5,13,0.7124197,6,12,14,606.5,-6,7,19,0.4833333,8,11,30,1.583333,9,-10,40,0.4142857,-7,10,13,0.4200963,-8,-9,16,0.7083333,-11,-12,4,1854.908,-13,13,5,8.5,-14,-15],[0.00026599,-0.047595,-0.024989,0.053825,0.018,0.025794,-0.0090746,0.014241,-0.014748,-0.010366,-0.0098347,0.014128,0.022336,-0.031066,-0.00042595]],[[10,0.06012048,1,6,13,1e-35,-1,2,15,-1.190579,3,-6,11,-1.285069,-2,4,25,-0.3333333,-3,5,28,0.281,-4,-5,27,0.45,7,8,31,0.9444444,-7,-8,31,0.9444444,9,12,6,14.5,10,-12,14,2667.5,11,-11,6,5.5,-9,-10,16,0.55,13,-15,2,21.5,-13,-14],[0.050076,-0.010626,0.013917,-0.00084391,0.021111,0.025511,-0.045916,-0.010507,-0.010756,-0.032349,0.0046878,-0.036244,-0.039302,-0.0032597,0.0077455]],[[24,-3.347722,1,2,27,0.9444444,-1,-2,10,0.06012048,3,9,8,1.252309,4,6,12,1.000001,5,-5,12,0.9952772,-3,-4,0,0.197,-6,7,19,0.4606061,-7,8,6,3.5,-8,-9,19,0.3484848,10,13,30,3.55,11,-13,14,4009.5,12,-12,6,4.5,-10,-11,16,0.7083333,-14,-15],[-0.046658,-0.020048,0.0275,0.052211,0.0027246,0.016059,0.00014331,-0.0076187,0.016912,-0.006773,-0.022055,0.0062147,-0.027076,-0.010109,0.0080133]],[[24,-2.703887,1,4,21,0.0195,-1,2,9,4.065118,3,-4,13,1e-35,-2,-3,10,0.0150188,5,7,13,1e-35,-5,6,28,0.281,-6,-7,31,0.9444444,8,11,6,9.5,9,-11,13,0.8239053,10,-10,14,529.5,-8,-9,23,7.5,12,13,4,7750.0,-12,-13,19,0.9375,-14,-15],[-0.042717,0.048531,-0.0083031,-0.037781,0.052264,0.010894,0.031868,0.023255,-0.0013928,-0.028484,-0.027731,0.0042162,-0.018482,0.0080038,0.037175]],[[24,-3.347722,1,3,27,0.9444444,-1,2,9,3.802221,-2,-3,8,2.168662,4,8,13,1e-35,-4,5,28,0.281,6,-8,24,-1.31372,-5,7,16,0.6333333,-6,-7,31,0.9444444,9,12,6,9.5,10,11,9,4.408405,-9,-10,7,1e-35,-11,-12,16,0.55,13,-15,18,0.9444444,-13,-14],[-0.045846,-0.0018279,-0.037331,0.052288,0.00051173,-0.0079313,0.019607,0.032713,-0.00039732,-0.028779,0.0025092,-0.03511,0.018272,-0.022993,0.0084042]],[[24,-3.347722,1,2,27,0.9444444,-1,-2,8,1.252309,-3,3,31,0.9444444,4,13,30,1.708333,5,12,9,3.325775,6,-11,39,5.291667,7,9,37,1.45,-4,8,13,0.2841395,-5,-6,11,0.3628258,10,-10,24,-1.876648,-7,11,48,0.6333333,-8,-9,7,1.5,-12,-13,27,0.9444444,-14,-15],[-0.045428,-0.018299,0.02752,0.0045261,-0.048131,0.0073525,0.0045614,0.027699,-0.085306,-0.011722,-0.016052,-0.012335,-0.0386,-0.011431,0.0077809]],[[24,-2.703887,1,4,9,3.431763,2,-4,13,1e-35,-1,3,26,1e-35,-2,-3,8,1.252309,5,6,13,1e-35,-5,-6,12,0.3122718,7,8,5,8.5,-7,-8,12,1.000001,9,-15,33,595.75,-9,10,8,2.694769,11,13,0,0.2452222,-10,12,19,0.3038462,-11,-12,23,7.5,-13,-14],[0.041581,-0.035201,-0.0076817,-0.038973,0.052414,0.021304,-0.021662,0.0029187,0.02299,0.021154,-0.0033968,0.012358,-0.0031489,0.0079278,-0.0065749]],[[24,-3.435118,1,2,27,0.9444444,-1,-2,10,0.06012048,3,9,8,1.252309,4,5,9,1e-35,-3,-4,49,0.4166667,6,-9,25,-0.3333333,7,-8,39,3.416667,8,-7,37,1.45,-5,-6,31,0.9444444,10,-15,6,16.5,11,-14,14,2667.5,12,-13,6,5.5,13,-12,9,4.978202,-10,-11],[-0.044676,-0.019637,0.033617,0.013321,0.012785,-0.031619,0.013276,-0.00012084,0.023157,-0.0061691,-0.040045,-0.029328,0.0040552,-0.035723,0.0020072]],[[24,-2.652488,1,3,9,3.431763,2,-3,27,0.9444444,-1,-2,8,1.252309,4,5,12,1.000001,-4,-5,12,0.3122718,6,10,4,1854.908,-6,7,23,1.5,-7,8,35,9.9,9,-10,4,7565.58,-8,-9,12,1.000001,11,12,33,595.75,-11,-12,50,0.5357143,-13,13,39,6.708333,-14,-15],[-0.032327,-0.0039534,-0.037745,0.030801,-0.0031819,0.021107,-0.042171,0.00099902,-0.026546,0.037172,0.022099,0.004769,0.0074732,-0.029253,-0.0023915]],[[24,-3.435118,1,2,27,0.9444444,-1,-2,8,2.288601,3,6,8,1.252309,4,-6,12,1.000001,5,-5,12,0.9952772,-3,-4,31,0.9444444,7,10,7,1.5,8,9,26,0.33175,-7,-8,29,0.8444444,-9,-10,16,0.55,11,12,18,0.9444444,-11,-12,27,0.9444444,-13,13,26,0.4305,-14,-15],[-0.043936,-0.018524,0.023645,0.050487,-0.0033334,0.00864,-0.0058514,0.0087749,-0.0055103,-0.035081,0.011868,-0.022314,-0.010285,0.01127,-0.0083489]],[[24,-3.435118,1,2,27,0.9444444,-1,-2,8,1.252309,3,4,12,1.000001,-3,-4,31,0.9444444,5,12,30,3.708333,6,-12,26,0.33175,7,8,9,4.009492,-5,-6,14,1662.5,9,-11,22,0.212406,10,11,4,1674.167,-7,-8,4,1610.0,-9,-10,49,0.4166667,13,-15,27,0.7083333,-13,-14],[-0.043512,-0.01794,0.029254,-0.0035719,-0.0037285,-0.026241,0.02908,-0.035329,-0.052069,0.015965,0.022216,-0.032157,-0.013545,0.0057011,0.024174]],[[24,-3.435118,1,2,21,0.0225,-1,-2,13,1e-35,-3,3,24,-1.876648,4,8,14,5415.5,5,7,4,1874.5,6,-6,21,0.0955,-4,-5,29,0.55,-7,-8,12,0.3709022,9,11,4,1773.0,-9,10,38,0.775,-10,-11,15,-1.190579,12,-15,12,1.002124,13,-14,14,706.5,-12,-13],[-0.040418,-0.011644,0.047066,-0.02026,0.012336,-0.017001,0.016744,-0.018695,0.02055,-0.016469,0.011256,0.029037,0.0064322,-0.0056775,0.026463]],[[24,-3.629995,-1,1,13,1e-35,-2,2,31,0.9444444,3,11,6,9.5,4,10,26,0.33575,5,7,14,2667.5,-3,6,36,7.775,-4,-5,39,3.775,8,9,12,0.8341359,-6,-7,13,0.4200963,-8,-9,7,1e-35,-10,-11,27,0.9444444,-12,12,15,-1.190579,-13,13,12,0.5299377,-14,-15],[-0.036808,0.046382,-0.010617,-0.0061935,0.013462,0.0064224,-0.048361,0.025117,-0.011018,0.00021559,-0.034782,-0.0099902,0.0065552,-7.0787e-05,0.02879]],[[27,0.7083333,1,2,31,0.775,-1,-2,10,0.0150188,3,6,16,0.6333333,-3,4,12,1.000001,5,-6,12,0.9926049,-4,-5,31,0.9444444,7,11,6,16.5,8,-11,14,1885.5,9,10,6,3.5,-7,-8,26,0.328125,-9,-10,16,0.775,12,13,7,4.5,-12,-13,6,5.5,-14,-15],[-0.039716,-0.0090286,-0.011001,0.013617,0.045627,-0.003132,-0.0067363,-0.026316,-0.0015754,0.018138,-0.034286,-0.02145,0.00022318,0.00090263,0.014326]],[[24,-3.629995,-1,1,13,1e-35,-2,2,31,0.9444444,3,10,30,3.708333,4,-10,26,0.33175,5,7,9,4.194136,6,-5,21,0.0375,-3,-4,14,1662.5,8,-9,34,47.25,-6,9,12,0.8126261,-7,-8,16,0.55,11,12,30,14.36667,-11,-12,12,0.3709022,-13,13,9,1e-35,-14,-15],[-0.035757,0.045253,-0.019125,-0.0027505,-0.028391,0.010704,-0.0051967,-0.05876,0.02023,-0.030165,-0.019257,0.0066854,-0.0022285,0.02475,0.010016]],[[21,1e-35,1,2,20,-3.319165,-1,-2,13,1e-35,-3,3,31,0.9444444,4,12,7,1.5,5,11,26,0.33175,6,10,9,4.978202,7,-8,21,0.2985,8,-7,21,0.276,9,-6,21,0.2695,-4,-5,33,1698.167,-9,-10,29,0.9444444,-11,-12,16,0.775,-13,13,11,0.6446022,-14,-15],[-0.041091,-0.01138,0.045449,-0.0028896,-0.057825,0.02005,-0.03159,-0.03755,-0.00048011,0.019126,-0.0083087,-0.034401,-0.0081383,0.014318,-0.0016198]],[[27,0.9444444,1,3,19,0.4083333,2,-3,49,0.2916667,-1,-2,13,1e-35,-4,4,31,0.9444444,5,10,7,1.5,6,9,26,0.33175,-5,7,11,0.6446022,8,-8,39,3.775,-6,-7,29,0.9444444,-9,-10,8,1.252309,-11,11,23,7.5,12,13,4,8160.865,-12,-13,19,0.775,-14,-15],[-0.037547,0.05004,-0.0042242,0.044603,-0.0047228,-0.0047642,0.020065,-0.010987,-0.0081694,-0.033466,0.020758,0.0050345,-0.021473,0.0075215,0.031075]],[[24,-3.668245,-1,1,8,1.252309,2,3,12,1.000001,-2,-3,11,0.6446022,4,11,24,-1.876648,5,8,14,5415.5,6,7,21,0.0115,-4,-5,30,0.4166667,-6,-7,16,0.55,-8,9,14,706.5,-9,10,4,1874.5,-10,-11,4,2001.5,12,13,34,147.375,-12,-13,23,1.5,-14,-15],[-0.035141,0.026333,-0.004887,-0.031214,-0.0061098,0.021956,-0.0063716,-0.010374,0.027775,-0.0061392,0.0082617,0.012673,-0.045556,-0.041282,-0.011371]],[[24,-3.668245,-1,1,13,1e-35,-2,2,24,-1.876648,3,8,14,4560.5,4,7,4,1874.5,5,-6,37,1.291667,6,-5,21,0.0605,-3,-4,29,0.9444444,-7,-8,16,0.55,-9,9,11,0.6446022,10,13,24,-1.090094,11,12,0,0.2452222,-10,-11,40,0.2916667,-12,-13,4,6213.5,-14,-15],[-0.034541,0.042226,-0.02616,0.016448,-0.034957,-0.015858,0.013137,-0.015491,-0.010253,0.014002,0.0024199,0.0025487,0.020836,-0.00038038,-0.020199]],[[21,1e-35,1,2,20,-3.342644,-1,-2,8,1.848594,3,5,8,1e-35,-3,4,28,0.281,-4,-5,9,4.408405,6,13,11,0.5609234,7,12,19,0.4833333,8,9,21,0.3455,-6,-7,16,0.775,10,-11,50,0.5857143,-8,11,2,18.5,-9,-10,14,788.5,-12,-13,20,-2.171185,-14,-15],[-0.039431,-0.010422,0.049223,0.0094446,0.031045,-0.0020521,0.0092869,0.010591,-0.046481,-0.0076287,0.012299,0.0046521,-0.013202,-0.03331,-0.0015448]],[[24,-3.668245,-1,1,13,1e-35,-2,2,31,0.9444444,3,13,7,1.5,4,12,21,0.2005,-3,5,11,0.4890029,6,11,39,3.291667,7,9,37,0.9444444,-4,8,12,0.6172357,-5,-6,48,0.9,10,-9,29,0.4166667,-7,-8,4,1977.5,-10,-11,29,0.8444444,-12,-13,28,0.23875,-14,-15],[-0.033263,0.040926,-0.0074917,0.018183,0.016775,-0.042334,0.02452,0.0016459,-0.043318,0.011482,-0.019672,-0.0034718,-0.032822,0.0041375,0.020642]],[[9,4.194136,1,13,13,1e-35,-1,2,19,0.3484848,3,12,26,1e-35,-2,4,30,2.55,5,11,26,0.2001667,-3,6,33,1793.167,7,10,50,0.9166667,8,9,4,1555.5,-4,-5,4,1555.5,-6,-7,50,0.2361111,-8,-9,20,-1.084256,-10,-11,16,0.775,-12,-13,20,-2.171185,-14,-15],[0.040494,-0.026897,-0.0039708,0.022807,-0.015404,-0.049654,0.00059326,-0.056289,0.014694,-0.019527,0.011234,-0.0059833,0.0093791,-0.036724,-0.00075161]],[[27,0.9444444,1,3,49,1e-35,2,-3,31,0.775,-1,-2,8,1.252309,4,5,12,1.000001,-4,-5,9,4.408405,6,-15,31,0.9444444,7,10,6,9.5,8,9,12,1.000001,-6,-7,7,1e-35,-8,-9,16,0.55,11,12,6,34.5,-10,-11,6,4.5,-12,13,19,0.6904762,-13,-14],[-0.037475,-0.011677,0.038463,0.024723,-0.0039132,0.003238,-0.011253,0.00066601,-0.028852,-0.019586,0.0089496,-0.00077383,0.0083957,0.024446,-0.020415]],[[27,0.9444444,1,3,19,0.4083333,2,-3,49,0.2916667,-1,-2,10,0.005038071,4,7,8,1e-35,-4,5,12,1.002124,6,-7,0,0.2452222,-5,-6,11,0.5609234,8,10,19,0.3484848,-8,9,16,0.775,-9,-10,4,1971.5,11,12,12,1.065741,-11,-12,5,8.5,13,-15,22,0.2546296,-13,-14],[-0.034044,0.047129,-0.0041264,0.04847,0.028188,0.0091354,-0.009339,-0.0017209,-0.003108,0.0099972,0.013825,-0.014009,-0.041125,-0.017318,7.7512e-06]],[[24,-3.668245,-1,1,13,1e-35,-2,2,31,0.9444444,3,12,6,9.5,4,11,26,0.33575,5,8,14,5922.5,6,-6,26,0.2981667,7,-5,26,0.075125,-3,-4,39,4.472222,9,10,13,0.3361275,-7,-8,11,0.3628258,-9,-10,7,1e-35,-11,-12,16,0.55,13,-15,6,34.5,-13,-14],[-0.031245,0.038352,-0.017581,-0.00099489,-0.031786,0.011025,-0.033596,0.0096223,0.022671,-0.008014,0.00010227,-0.030115,-0.018175,0.0075636,0.0072317]],[[21,1e-35,1,2,20,-3.342644,-1,-2,13,1e-35,-3,3,31,0.7083333,4,11,6,9.5,5,10,21,0.3455,6,9,33,5413.5,7,-7,21,0.2985,8,-6,21,0.276,-4,-5,14,1634.5,-8,-9,7,1e-35,-10,-11,16,0.55,12,13,6,34.5,-12,-13,10,0.005038071,-14,-15],[-0.036655,-0.009515,0.038539,-0.005282,0.018794,-0.031273,0.014768,-0.0030552,0.017216,0.00082612,-0.029476,-0.017171,0.0067678,0.018011,0.005829]],[[20,-3.815406,-1,1,8,1.252309,2,4,13,1e-35,-2,3,20,-1.768544,-3,-4,11,0.5609234,5,10,12,1.000001,6,-10,22,0.8867521,-5,7,4,4790.73,-6,8,5,8.5,9,-9,2,24.5,-7,-8,4,1971.5,11,12,12,1.044826,-11,-12,5,8.5,13,-15,50,1e-35,-13,-14],[-0.031677,0.048998,-0.028891,0.016872,0.0010268,-0.039629,0.023798,0.0071939,0.0011437,-0.0096596,0.014371,-0.0133,-0.03817,-0.017255,0.0005558]],[[9,4.194136,1,13,8,1.252309,2,4,12,1.000001,3,-3,12,0.9952772,-1,-2,21,1e-35,5,6,49,1e-35,-4,-5,12,0.2883545,7,10,5,8.5,8,-9,39,5.55,-6,9,6,17.5,-7,-8,12,1.000001,-10,11,39,3.1,12,-13,37,1.45,-11,-12,31,0.9444444,-14,-15],[0.017671,0.045562,-0.0047549,-0.017685,0.035121,-0.0095815,-0.051544,-0.0074066,0.0053011,0.0035618,-0.0057487,-0.049334,-0.0012411,-0.030339,0.0022348]],[[9,4.194136,1,13,10,0.005038071,2,5,0,0.3673333,3,-4,12,1.000001,4,-3,12,0.6392641,-1,-2,33,3236.167,6,-13,27,0.55,-5,7,49,1e-35,8,-12,12,0.1267939,-6,9,33,608.75,-7,10,12,0.7324292,-8,11,39,3.1,12,-11,37,1.45,-9,-10,20,-2.189327,-14,-15],[0.00037737,0.02902,-0.0088084,0.0047467,-0.017063,-0.019963,0.0084668,-0.0079456,0.0031048,-0.042212,0.0075064,0.021337,0.0056458,-0.034258,-0.00038527]],[[24,-2.703887,1,2,9,4.065118,-1,-2,8,1.252309,3,4,13,1e-35,-3,-4,12,0.3122718,5,6,5,8.5,-5,-6,33,608.75,-7,7,16,0.55,-8,8,39,1.775,9,12,50,0.2361111,-9,10,12,0.5997326,-10,11,21,0.1395,-11,-12,24,-1.374317,-13,13,12,0.7058264,-14,-15],[-0.0073221,-0.035439,0.048209,0.013737,-0.017534,0.0046674,0.015572,-0.0093603,0.01719,0.010771,-0.010248,-0.038661,0.00080192,0.0022264,0.014531]],[[20,-3.815406,-1,1,13,1e-35,-2,2,19,0.3484848,3,12,26,0.2371667,4,6,6,5.5,5,-5,9,4.626336,-3,-4,33,1866.25,7,8,26,0.2431667,-6,-7,50,1e-35,-8,9,30,4.416667,10,11,11,0.4890029,-9,-10,20,-0.9885117,-11,-12,16,0.775,-13,13,6,4.5,-14,-15],[-0.02986,0.034599,-0.0020347,-0.030888,-0.014521,0.052533,-0.0057944,-0.051844,0.017579,-0.01233,-0.025028,0.016702,-0.0048133,-0.00062867,0.011802]],[[27,0.9444444,1,4,49,1e-35,2,-4,20,-2.728915,-1,3,32,0.8804762,-2,-3,13,1e-35,-5,5,24,-1.876648,-6,6,13,0.5528765,7,12,39,3.1,8,11,37,1.083333,-7,9,12,0.8053372,10,-10,4,1773.0,-8,-9,0,0.2452222,-11,-12,32,0.8580586,13,-15,4,6213.5,-13,-14],[-0.035345,-0.0065151,-0.088888,0.032867,0.034646,-0.0045509,0.010134,-0.021637,0.016567,-0.043747,0.018042,0.0048923,0.0026196,-0.018968,0.025694]],[[24,-2.703887,1,4,9,4.065118,2,-4,14,6244.5,-1,3,0,0.3442222,-2,-3,8,1.252309,5,6,13,1e-35,-5,-6,12,0.1539572,7,8,5,8.5,-7,-8,14,706.5,-9,9,11,0.5609234,10,-15,16,0.55,-10,11,19,0.4365079,12,13,21,0.3455,-11,-12,6,4.5,-13,-14],[-0.0095776,0.04785,-7.8796e-05,-0.034079,0.047438,0.013027,-0.026635,-0.0010728,0.014499,-0.006954,-0.0026589,0.0086675,-0.0028951,0.010986,-0.0082613]],[[9,4.33172,1,13,13,1e-35,-1,2,31,0.9444444,3,7,6,9.5,4,5,26,0.03775,-2,-3,23,8.5,-4,6,6,18.5,-5,-6,16,0.55,8,11,6,34.5,-7,9,19,0.9375,10,-10,16,0.2678571,-8,-9,6,4.5,-11,12,19,0.9375,-12,-13,20,-2.171185,-14,-15],[0.032846,-0.01436,0.0011442,-0.032053,0.0006304,-0.026272,-0.015525,-0.051658,0.0070994,0.052035,-0.00010983,0.0063865,0.022162,-0.032954,-0.0005314]],[[20,-3.815406,-1,1,13,1e-35,-2,2,31,0.775,3,10,6,16.5,4,-10,9,4.978202,5,-9,26,0.33175,-3,6,33,1215.25,7,-8,34,86.33333,8,9,4,1368.77,-4,-5,4,1610.0,-6,-7,16,0.55,11,12,6,34.5,-11,-12,49,0.875,13,-15,6,4.5,-13,-14],[-0.027702,0.030573,-0.0034957,0.023541,-0.019414,-0.050319,0.0067931,0.013199,-0.032119,-0.031003,-0.014968,0.0073505,-0.00091762,0.0076721,0.025712]],[[21,1e-35,1,5,49,1e-35,2,-5,20,-2.728915,-1,3,22,0.8603896,4,-4,34,33.625,-2,-3,8,1.252309,6,8,13,1e-35,-6,7,15,-1.653034,-7,-8,33,5413.5,9,-15,9,5.068838,10,-14,49,0.4166667,11,13,13,0.7124197,12,-11,34,26.0,-9,-10,34,505.8333,-12,-13],[-0.033752,-0.05086,-0.0011826,-0.041699,0.030683,0.046504,-0.010164,0.018735,0.031939,-0.00031238,-0.0090466,0.023227,-0.0061352,-0.025361,0.0091233]],[[21,1e-35,1,3,49,1e-35,2,-3,20,-2.728915,-1,-2,31,0.9444444,4,-15,6,16.5,5,-14,26,0.31125,6,11,26,0.2981667,7,10,21,0.276,8,-7,21,0.2695,9,-6,6,5.5,-4,-5,4,1532.5,-8,-9,40,0.2916667,12,13,13,0.3270423,-10,-11,11,0.2554128,-12,-13],[-0.032946,-0.0097971,0.029114,0.00013802,-0.012031,-0.054216,0.017948,0.01981,-0.06127,-0.029685,0.0088641,0.022273,-0.0063914,-0.030132,0.0051599]],[[27,0.9444444,1,3,9,3.340748,2,-3,37,0.3666667,-1,-2,31,0.9444444,4,10,6,16.5,5,-10,9,5.167001,6,-9,6,4.5,7,8,10,1e-35,-4,-5,23,8.5,-6,9,2,16.5,-7,-8,16,0.55,11,12,6,34.5,-11,-12,10,1e-35,-13,13,6,4.5,-14,-15],[0.0083097,-0.019528,-0.035214,0.018354,0.00096587,-0.019036,-0.023791,0.011819,-0.03526,-0.029379,-0.015243,0.0074554,0.019373,-0.00099912,0.0081448]],[[21,1e-35,1,2,24,-3.323693,-1,-2,8,1.252309,3,4,13,1e-35,-3,-4,22,0.8603896,5,10,4,6213.5,6,7,24,-2.044173,-5,-6,34,180.125,8,-10,6,17.5,9,-9,5,6.5,-7,-8,4,4790.73,-11,11,5,7.5,12,13,25,-1.550327,-12,-13,4,7283.592,-14,-15],[-0.03121,-0.008467,0.046212,0.012019,-0.0052807,0.0033315,-0.042635,-0.013994,-0.0052163,0.003898,-0.037833,0.031576,0.009992,-0.023074,0.0049202]],[[9,4.33172,1,13,13,1e-35,-1,2,15,-1.190579,3,12,12,1.002124,4,-11,34,175.1667,5,10,4,6213.5,6,-7,12,0.768541,7,8,39,8.8375,-2,-3,39,3.291667,9,-6,37,1.225,-4,-5,4,2658.5,-8,11,25,-1.286995,-9,-10,12,0.647985,-12,-13,20,-2.171185,-14,-15],[0.029214,0.0033663,-0.012351,0.0085449,-0.040134,0.010665,-0.017251,-0.04939,0.017818,0.0032506,-0.0093564,-0.0027956,0.026611,-0.030383,0.00045401]],[[21,1e-35,1,4,9,3.692951,2,-4,37,0.3666667,3,-3,34,60.25,-1,-2,10,0.0150188,5,10,28,0.281,6,-10,12,0.5339682,7,8,34,376.125,-5,-6,12,1.000001,9,-9,12,0.9952772,-7,-8,33,2665.125,11,-15,4,7172.388,12,-14,9,5.068838,13,-13,49,0.4166667,-11,-12],[-0.022527,0.016464,-0.018597,-0.036641,-0.01609,0.02438,0.0075136,0.036421,-0.0065482,0.021619,-0.0018104,0.025183,-0.026017,-0.014526,0.0033885]],[[24,-2.703887,1,2,9,4.065118,-1,-2,10,1e-35,3,5,13,1e-35,-3,4,28,0.23875,-4,-5,19,0.3484848,6,-15,30,3.55,7,13,37,2.45,8,12,4,1878.195,9,11,37,1.291667,-6,10,4,1555.5,-7,-8,34,57.25,-9,-10,4,1878.195,-11,-12,20,-0.9885117,-13,-14],[-0.0056919,-0.029921,0.049414,0.0025372,0.024351,0.011445,-0.041888,0.017014,-0.033435,-0.003971,-0.036966,0.011092,-0.018525,0.011858,0.0033108]],[[31,0.9444444,1,13,6,9.5,2,11,9,4.978202,3,-10,26,0.33575,4,10,10,0.5552778,5,-7,33,5413.5,6,-6,6,2.5,7,-5,26,0.07116667,-1,8,4,1489.5,9,-4,37,1.291667,-2,-3,8,1.604726,-8,-9,7,1e-35,-11,12,8,1.848594,-12,-13,28,0.23875,-14,-15],[-0.014019,0.01864,-0.043554,-0.0044993,-0.013327,0.0099439,0.0076857,0.030442,0.0041866,-0.035297,2.6787e-10,-0.071693,-0.024699,0.0026097,0.017046]],[[21,1e-35,1,2,49,1e-35,-1,-2,31,0.9444444,3,11,6,16.5,4,-11,6,4.5,5,10,40,0.2361111,6,9,13,0.3450353,7,8,50,0.2361111,-3,-4,34,170.1667,-5,-6,11,0.3628258,-7,-8,14,3382.5,-9,-10,16,0.775,-12,12,6,5.5,-13,13,19,0.5634921,-14,-15],[-0.017099,0.029552,0.01227,-0.023718,0.0013302,0.033163,0.011011,-0.012929,-0.018906,0.0032751,-0.027789,-0.0056598,0.0012294,0.0071566,0.01997]],[[24,-2.703887,1,3,27,0.9444444,2,-3,22,0.8867521,-1,-2,8,-1e-35,-4,4,12,0.3122718,5,9,5,8.5,6,8,4,2207.5,-5,7,6,17.5,-6,-7,4,10756.5,-8,-9,12,1.002124,10,12,8,1.252309,-10,11,14,590.5,-11,-12,50,0.5357143,-13,13,43,4.083333,-14,-15],[-0.02992,0.048294,-0.005958,0.042859,0.006333,-0.0311,-0.0010533,0.012834,-0.011586,0.014758,0.017872,0.0018902,0.0049436,-0.019727,0.0011379]],[[31,0.9444444,1,9,6,9.5,2,8,9,4.978202,3,-7,21,0.2005,4,5,10,0.3951744,-1,-2,33,2140.167,6,7,21,0.2455,-3,-4,32,0.4767316,-5,-6,23,9.5,-8,-9,16,0.55,10,12,6,34.5,-10,11,19,0.9375,-11,-12,10,0.005038071,-13,13,21,0.4305,-14,-15],[-0.006979,0.0040502,0.022976,-0.0024254,-0.040264,0.015325,-0.034161,-0.026988,-0.0073072,-0.014798,-0.00016972,0.047448,0.013753,0.0046073,-0.0091465]],[[21,1e-35,1,4,9,3.692951,2,-4,37,0.6333333,3,-3,34,33.625,-1,-2,13,1e-35,5,6,25,-1.050307,-5,-6,31,0.7083333,7,13,6,16.5,8,-13,9,5.167001,9,-12,6,4.5,-7,10,14,4379.5,11,-11,0,0.493,12,-10,7,1e-35,-8,-9,28,0.2758333,-14,-15],[-0.041477,0.011219,-0.017929,-0.034869,-0.0084207,0.040208,0.0015302,-0.0038989,-0.036052,-0.0063012,0.005011,-0.031674,-0.027132,0.0028735,0.017838]],[[13,1e-35,-1,1,20,-3.815406,-2,2,15,-1.190579,3,13,12,1.002124,4,12,34,175.1667,5,10,4,6213.5,6,-8,12,0.768541,7,8,39,9.583333,-3,-4,39,3.416667,9,-7,34,140.125,-5,-6,4,2658.5,-9,11,25,-1.286995,-10,-11,50,0.8166667,-12,-13,12,0.5299377,-14,-15],[0.027441,-0.023592,0.0021674,-0.011957,-0.0011677,-0.03546,0.0096371,-0.015762,-0.047051,0.016708,0.0026663,0.0024972,-0.014865,-0.0083033,0.022439]],[[21,1e-35,1,2,19,0.4833333,-1,-2,10,0.0150188,3,12,12,0.6392641,4,6,34,376.125,5,-5,4,7565.58,-3,-4,15,-1.190579,7,-12,50,0.6333333,-6,8,40,0.3666667,9,10,37,2.291667,-7,-8,16,0.9,-9,11,20,-1.319656,-10,-11,34,175.1667,-13,13,4,2658.5,-14,-15],[-0.021061,-0.0014083,-0.0034203,-0.037163,0.019783,0.018013,-0.0078442,-0.054595,-0.019986,0.0028283,0.020661,0.025024,-0.0030126,-0.043403,0.0046822]],[[31,0.9444444,1,11,6,9.5,2,10,9,4.978202,3,-9,21,0.2005,4,7,10,0.3951744,5,-4,13,0.003541388,6,-3,25,-1.138042,-1,-2,33,2140.167,8,9,21,0.2455,-5,-6,32,0.4767316,-7,-8,23,9.5,-10,-11,49,0.4166667,12,-15,15,-1.190579,-12,13,13,0.2098673,-13,-14],[-0.026706,0.027634,-0.0084213,0.0039049,0.022424,-0.0023905,-0.037876,0.014345,-0.03272,-0.025803,-0.0073895,0.0011004,0.029896,0.00056502,0.015687]],[[21,1e-35,1,3,49,1e-35,2,-3,9,3.340748,-1,-2,13,1e-35,-4,4,31,0.7083333,5,13,44,0.3666667,6,-13,26,0.105125,7,11,4,1077.0,-5,8,26,0.09316667,9,-9,21,0.0845,-6,10,21,0.0895,-7,-8,26,0.1381667,12,-12,4,1874.5,-10,-11,16,0.55,-14,-15],[-0.009307,-0.032157,0.027879,0.025867,-0.028849,-0.0044771,0.046171,-0.00050688,-0.026114,0.037454,0.0017601,-0.00029137,-0.017383,-0.0080268,0.0053235]],[[10,0.0150188,1,2,13,1e-35,-1,-2,9,5.167001,3,-15,25,-1.246704,4,12,39,9.733333,5,11,13,0.3711269,6,9,37,1.291667,7,-6,38,0.45,8,-5,33,1054.167,-3,-4,13,0.7848418,-7,10,5,8.5,-8,-9,11,0.3628258,-10,-11,18,0.9444444,-12,13,38,0.775,-13,-14],[0.041288,0.0044196,-0.0057213,0.023301,-0.014652,-0.031752,0.014468,-0.01717,0.013394,0.015809,-0.0023699,0.0014823,-0.010699,0.0010185,-0.025437]],[[21,1e-35,1,2,49,1e-35,-1,-2,8,1e-35,-3,3,31,0.9444444,4,13,6,16.5,5,-13,6,3.5,6,9,40,0.2361111,7,8,49,0.4166667,-4,-5,11,0.3628258,-6,-7,34,270.1667,10,12,0,0.299,-8,11,15,-3.693346,-9,-10,11,-0.1111715,-11,-12,21,0.4305,-14,-15],[-0.01463,0.026005,0.040481,-0.0053644,0.021257,0.010547,-0.013122,-0.038529,-0.00038692,-0.019841,-0.00677,0.013653,-0.025609,0.004557,-0.0062142]],[[27,0.9444444,1,4,49,0.875,2,-4,19,0.4083333,-1,3,32,0.8675439,-2,-3,13,1e-35,5,6,15,-3.995257,-5,-6,31,0.7083333,7,12,30,4.708333,8,-12,40,1e-35,9,10,13,0.3450353,-7,-8,11,0.3628258,11,-11,37,1.083333,-9,-10,16,0.55,13,-15,24,-1.480764,-13,-14],[-0.021791,0.0003137,-0.071232,0.04385,-0.0012832,0.043578,-0.012269,0.0033014,-0.0037678,0.012069,-0.011279,-0.024624,-0.04357,-0.0054572,0.0048979]],[[10,0.0150188,1,2,13,1e-35,-1,-2,9,5.167001,3,-15,25,-1.271286,4,10,12,0.9894663,5,9,39,9.733333,6,-7,12,0.6302976,7,8,34,170.1667,-3,-4,37,1.45,-5,-6,50,0.4642857,-8,-9,9,3.238265,11,-14,12,0.5254259,12,-13,38,0.2916667,13,-12,4,1773.0,-10,-11],[0.040175,0.0040056,0.0038198,0.02281,0.0041563,-0.027591,0.011074,0.018401,-0.018994,0.0067924,-0.019837,0.0061992,-1.779e-05,-0.020138,-0.024585]],[[31,0.9444444,1,6,6,16.5,2,-6,26,0.03775,3,4,26,0.03125,-1,-2,6,4.5,-3,5,2,19.5,-4,-5,16,0.55,7,10,6,34.5,-7,8,19,0.9375,9,-10,16,0.2678571,-8,-9,6,4.5,11,12,0,0.2894444,-11,-12,19,0.4833333,13,-15,20,-1.564991,-13,-14],[-0.007914,-0.032915,0.0022627,-0.018437,0.0043263,-0.025696,-0.013579,-0.047579,0.0057458,0.044606,0.0050797,-0.0071571,-0.006929,0.0071201,0.0099285]],[[21,1e-35,1,2,49,1e-35,-1,-2,10,0.005038071,3,5,28,0.07708333,-3,4,4,1461.0,-4,-5,34,175.1667,6,12,4,7565.58,7,-12,38,0.225,8,-11,12,0.768541,-6,9,40,1e-35,10,-10,37,1.45,11,-9,26,0.07416667,-7,-8,4,2658.5,-13,13,14,2833.0,-14,-15],[-0.013572,0.022997,-0.0073414,0.028382,0.0072019,-0.0065346,-0.025902,0.016755,-0.035821,0.0065228,0.012532,-0.017064,-0.041426,0.019709,0.0028481]],[[13,1e-35,1,2,25,-1.050307,-1,-2,27,0.9444444,3,8,9,3.692951,4,-8,43,0.225,5,7,35,2.9,6,-5,47,0.5857143,-3,-4,38,2.583333,-6,-7,33,5413.5,9,13,28,0.281,10,12,13,0.7124197,-9,11,38,5.416667,-10,-11,13,0.2300991,-12,-13,19,0.6904762,-14,-15],[-0.0093817,0.03532,0.0063064,-0.050201,0.014722,-0.011375,-0.062393,-0.031198,-0.00033728,-0.0096284,0.01809,0.019836,-0.0013762,0.0044037,0.025313]],[[12,1.000001,1,9,13,0.003541388,2,3,25,-1.120641,-1,-2,24,-3.758679,-3,4,12,0.3122718,5,-9,5,8.5,6,8,4,2207.5,-4,7,23,7.5,-5,-6,4,10756.5,-7,-8,50,0.5357143,-10,10,40,0.3666667,11,-15,37,1.45,12,-14,34,147.375,13,-13,26,0.09316667,-11,-12],[-0.00988,0.028416,-0.019195,0.003728,-0.02605,0.0023608,0.013842,-0.011807,0.0017546,0.0017143,-0.021505,0.053284,-0.028701,-0.042102,-0.0060504]],[[31,0.9444444,1,10,6,16.5,2,-10,26,0.33175,3,6,6,5.5,-1,4,23,9.5,5,-4,8,2.627024,-2,-3,14,1219.5,7,-9,22,0.245,8,9,26,0.6555,-5,-6,12,0.6746639,-7,-8,8,1.252309,-11,11,6,2.5,-12,12,19,0.6904762,-13,13,6,21.5,-14,-15],[-0.0011061,-0.037976,-0.01259,0.0033916,0.0083027,-0.056714,-0.0041783,-0.052095,0.011492,-0.025016,0.012301,-0.0062493,0.0014166,0.0064157,0.028822]],[[31,0.9444444,1,11,6,16.5,2,10,9,5.167001,3,-9,21,0.1965,4,5,10,0.3951744,-1,-2,14,1885.5,-3,6,37,2.928571,7,8,44,0.4142857,-4,-5,30,1.708333,9,-8,12,1.000001,-6,-7,18,0.4642857,-10,-11,49,0.875,12,13,8,1.252309,-12,-13,2,25.5,-14,-15],[-0.0074715,0.0035217,-0.0031247,0.004223,-0.031293,0.024698,-0.0092279,-0.005641,-0.032382,0.056419,-0.025998,0.01127,0.0010337,0.027664,-0.0074607]],[[12,1.002124,1,-15,8,1.252309,-1,2,34,175.1667,3,12,4,7565.58,4,11,12,0.768541,5,10,38,0.225,6,-7,25,-1.411807,-2,7,4,1773.0,-3,8,37,1.291667,9,-6,2,15.5,-4,-5,9,3.092129,-8,-9,6,18.5,-10,-11,4,2658.5,-12,13,25,-1.383652,-13,-14],[0.013976,0.0015337,0.0043205,-0.037279,-0.0066874,-0.0050799,0.012869,0.0070073,-0.021763,-0.029594,-0.0058134,-0.041094,0.014685,0.0023865,-0.007341]],[[15,-1.190579,1,13,12,1.002124,2,11,34,170.1667,3,10,4,7565.58,4,-8,9,4.408405,5,-7,12,0.7485033,6,7,22,0.6733333,-1,-2,39,3.1,8,-6,37,1.225,9,-5,20,-2.992608,-3,-4,4,2175.5,-9,-10,42,1.9,12,-13,37,1.916667,-11,-12,13,0.2132685,-14,-15],[-0.0010992,-0.02034,-0.033033,0.014458,-0.033799,0.0076219,-0.018798,-0.015854,-0.036467,0.0043156,-0.0059978,-0.025981,0.00053672,0.027729,-0.0013994]],[[31,0.9444444,1,7,6,9.5,2,3,9,5.167001,-1,-2,7,1e-35,-3,4,2,22.5,-4,5,6,21.5,6,-7,26,0.08416667,-5,-6,28,0.23875,8,-15,6,2.5,-8,9,19,0.775,10,13,32,0.467029,-9,11,34,175.1667,-10,12,4,2526.5,-11,-12,6,21.5,-13,-14],[0.00026858,-0.031789,6.5031e-10,-0.034266,-0.029101,0.012262,-0.03177,-0.0045074,0.0065373,-0.0076134,-0.049161,0.0021434,0.0057735,0.031345,0.01253]],[[13,1e-35,1,2,25,-0.9187054,-1,-2,20,-3.815406,-3,3,24,-1.374317,4,6,25,-1.396239,-4,5,28,0.08366667,-5,-6,28,0.281,7,-15,8,3.141945,8,13,13,0.3128439,-7,9,34,416.4,10,-12,4,6213.5,-8,11,6,12.5,12,-11,4,7642.5,-9,-10,20,-0.9501276,-13,-14],[-0.0054194,0.034724,-0.018418,0.0037319,-0.0083215,-0.00029453,0.0096056,0.00060747,-0.017508,-0.064118,-0.0055678,0.014606,0.00063237,-0.015536,0.024162]],[[13,1e-35,1,2,15,-3.916438,-1,-2,20,-3.815406,-3,3,33,5413.5,4,11,26,0.6715,5,10,32,0.6757353,-4,6,26,0.24925,7,-9,4,1489.5,8,9,34,147.375,-5,-6,4,4790.73,-7,-8,4,1878.195,-10,-11,19,0.6904762,12,-15,29,0.2916667,-12,13,49,0.4166667,-13,-14],[0.0010132,0.041269,-0.017792,0.00067664,0.048973,-0.03739,-0.018531,-0.0044712,0.0033517,-0.089952,0.0093001,0.011315,0.0015226,-0.023053,0.023301]],[[31,0.9444444,1,12,30,4.708333,2,-12,21,0.0605,3,7,14,1091.5,-1,4,21,0.0545,-2,5,2,2.5,-3,6,20,-3.021199,-4,-5,0,0.509,8,-11,44,0.9444444,9,-10,30,1.125,10,-9,24,-1.374317,-6,11,14,1154.5,-7,-8,49,0.4166667,-13,13,2,22.5,-14,-15],[-0.026874,-0.0018543,0.05753,0.0014179,-0.045109,-0.00071737,-0.02063,0.021442,-0.013617,-0.022354,0.00735,-0.021626,0.0014649,0.022069,0.00031319]],[[8,1e-35,-1,1,33,5642.25,2,8,20,-4.46634,-2,3,28,0.191,4,5,21,0.6715,-3,-4,13,0.2366947,6,7,21,0.0465,-5,-6,0,0.207,-7,-8,5,7.5,9,12,2,22.5,10,11,34,887.5,-9,-10,22,0.9622507,-11,-12,13,0.191696,-13,13,38,5.583333,-14,-15],[0.035525,-0.035602,-0.0015423,-0.03868,-0.001395,0.016173,-0.022934,-0.0016556,0.0097456,0.036854,0.012305,-0.022963,-0.011375,-0.0087455,0.016194]],[[12,1.000001,1,12,13,0.003541388,2,3,15,-3.983473,-1,-2,34,57.25,4,9,4,1555.5,5,6,20,-1.898624,-3,-4,5,7.5,7,8,0,0.249,-5,-6,21,0.4305,-7,-8,34,92.625,-9,10,4,1288.5,11,-12,37,0.9444444,-10,-11,42,1.775,13,-15,37,1.916667,-13,-14],[-0.00039018,0.033231,-0.0058873,0.016141,-0.046517,-0.020684,0.010267,-0.020989,0.0079817,0.010445,-0.043525,0.00070938,-0.0048072,-0.02319,0.0009934]],[[33,5642.25,1,12,24,-2.727018,2,3,9,4.626336,-1,-2,28,0.281,4,11,25,-2.96259,-3,5,12,0.2840099,6,8,5,7.5,7,-6,6,17.5,-4,-5,34,26.0,-7,9,32,0.8639169,-8,10,12,0.7812174,-9,-10,12,0.7364633,-11,-12,5,7.5,-13,13,12,0.8089278,-14,-15],[-0.0053325,-0.029745,0.013144,-0.025636,0.00043501,0.0014968,0.02611,0.00031664,0.003962,-0.024535,-0.0016852,0.019906,0.01374,0.0089343,-0.010852]],[[27,0.7083333,1,4,37,0.6333333,2,-4,35,2.9,3,-3,34,60.25,-1,-2,8,1e-35,-5,5,33,5642.25,6,13,21,0.6715,7,12,21,0.6605,8,11,18,0.6333333,-6,9,25,-1.246704,-7,10,4,1773.0,-8,-9,4,1489.5,-10,-11,4,1878.195,-12,-13,19,0.9375,-14,-15],[-0.045236,0.010637,0.010235,-0.017291,0.03431,0.0036928,0.0014112,0.0091861,-0.0070733,-0.040595,0.031168,-0.085459,0.0087074,0.0040191,0.024628]],[[31,0.9444444,1,9,6,16.5,2,-9,21,0.0375,3,5,4,1461.0,-1,4,21,0.0325,-2,-3,6,3.5,-4,6,2,14.5,7,8,7,1e-35,-5,-6,33,3905.333,-7,-8,16,0.55,10,11,6,34.5,-10,-11,6,3.5,-12,12,19,0.4365079,13,-15,21,0.2435,-13,-14],[-0.029681,0.0021061,-0.033512,0.0025198,1.0033e-05,-0.036806,-0.0063189,0.0081386,-0.022624,-0.013315,0.0044566,-0.0021621,-0.0046252,0.0091776,0.0088759]],[[27,0.9444444,1,2,49,0.875,-1,-2,16,0.3666667,-3,3,31,0.7083333,4,5,30,4.708333,-4,-5,16,0.775,6,8,7,4.5,7,-8,10,0.1201266,-6,-7,13,0.3224376,9,12,39,3.416667,10,-12,4,6213.5,11,-11,32,0.4017544,-9,-10,8,3.639252,13,-15,37,4.416667,-13,-14],[-0.010217,0.03794,-0.017019,-0.00041242,-0.021648,-0.0020815,-0.026445,0.0059924,0.0085552,-0.025466,0.019571,0.011957,-0.005679,0.02208,0.0097513]],[[28,0.1305556,1,11,12,1.002124,2,-11,25,-1.246704,3,10,39,9.733333,4,9,13,0.2915851,5,8,50,0.4642857,-1,6,14,1174.5,-2,7,34,135.875,-3,-4,21,0.4295,-5,-6,11,0.3628258,-7,-8,9,2.293563,-9,-10,13,0.2366947,12,13,21,0.2315,-12,-13,0,0.207,-14,-15],[0.012159,-0.038347,0.0069801,-0.023116,0.010129,-0.0093312,0.014408,-0.0023864,-0.0010288,-0.011959,-0.008892,0.0047316,0.019062,-0.021465,-7.5974e-05]],[[28,0.1305556,1,6,25,-2.96259,-1,2,9,5.068838,3,-6,21,0.6715,4,-5,25,-1.246704,5,-4,40,0.9375,-2,-3,13,0.2366947,7,10,26,0.2295833,8,9,19,0.4833333,-7,-8,30,12.55,-9,-10,23,7.5,11,-15,32,0.467029,12,-14,34,75.25,13,-13,33,952.25,-11,-12],[0.012247,-0.0025737,0.0081096,-0.0031354,-0.040487,-0.033154,-0.0025971,0.011876,0.018383,-0.013816,-0.0058153,-0.04345,0.006596,-0.022035,0.0073069]],[[15,-1.190579,1,13,20,-4.46634,-1,2,49,0.875,3,10,33,8993.5,4,-9,21,1e-35,5,7,32,0.6258333,6,-4,24,-1.715112,-2,-3,18,0.9444444,8,9,24,-1.052812,-5,-6,11,-0.5345833,-7,-8,2,21.5,11,-13,4,12043.97,12,-12,21,0.2545,-10,-11,13,0.2132685,-14,-15],[-0.033595,-0.012015,0.0087212,-0.02203,0.0011071,0.019365,-0.011159,-0.00076009,0.016985,0.024637,-0.033364,-0.025279,-0.010484,0.025475,-0.0011295]],[[12,1.000001,1,12,13,0.003541388,2,3,15,-3.879042,-1,-2,34,173.1667,4,10,4,7565.58,5,-9,24,-1.374317,6,8,15,-3.015003,-3,7,4,1461.0,-4,-5,12,0.768541,-6,9,16,0.55,-7,-8,4,2207.5,-10,11,25,-1.286995,-11,-12,42,1.775,13,-15,37,1.775,-13,-14],[0.00020018,0.032471,0.00077718,0.0092051,-0.016402,5.6773e-05,-0.0071104,0.01494,-0.016658,-0.03983,0.011255,0.0014251,-0.0049847,-0.02261,0.00091177]],[[28,0.1235417,1,9,12,1.002124,2,-9,25,-1.246704,3,8,39,9.733333,4,7,12,0.6302976,5,6,26,0.4325,-1,-2,34,646.1667,-3,-4,11,0.5609234,-5,-6,24,-1.206373,-7,-8,12,0.7364633,10,13,23,7.5,11,-13,5,7.5,12,-12,4,1874.5,-10,-11,5,6.5,-14,-15],[0.0099632,-0.0089485,-0.014746,0.011313,0.01099,-0.014013,-0.0057322,0.0029826,-0.0089729,0.0029426,-0.025595,0.002655,0.0077867,0.011507,0.00023054]],[[15,-1.190579,1,13,12,1.002124,2,10,36,7.55,3,7,13,0.005886441,4,5,10,0.2450166,-1,-2,42,0.4166667,6,-5,21,0.2435,-3,-4,14,2667.5,8,9,11,1e-35,-6,-7,6,18.5,-8,-9,42,1.775,11,-13,34,130.25,-10,12,14,6353.5,-11,-12,13,0.471507,-14,-15],[0.01692,-0.013796,0.039998,-0.0058778,-0.0018201,-0.037312,0.0052706,0.0094878,-0.0027492,-0.003579,-0.029677,-0.0032024,0.00014188,0.018396,-0.0076164]],[[28,0.1255,1,12,12,1.002124,2,10,25,-1.246704,3,8,40,0.9375,4,7,12,0.6746639,5,6,15,-3.927313,-1,-2,37,1.291667,-3,-4,37,1.45,-5,-6,10,0.02006711,-7,9,9,3.818789,-8,-9,50,0.4642857,-10,11,40,0.3666667,-11,-12,19,0.4365079,13,-15,24,-1.301871,-13,-14],[0.012947,-0.00039043,0.0020165,-0.028498,-0.0061635,0.011584,0.0029446,-0.0048714,-0.02891,0.010411,-0.025754,-0.0053381,-0.0027091,0.012164,0.0091559]],[[15,-1.190579,1,13,12,1.000001,2,-13,13,0.003541388,3,4,15,-3.983473,-1,-2,34,164.5,5,10,4,7750.0,6,-8,38,3.366667,7,-7,19,0.422619,8,-6,20,-1.304632,9,-5,4,1874.5,-3,-4,4,2161.47,-9,11,2,4.5,-10,12,11,-0.3491638,-11,-12,13,0.1209339,-14,-15],[-0.00036559,0.026613,0.00036658,-0.0098012,0.0059772,0.0032614,0.020356,-0.014007,-0.030586,0.029693,-0.0036078,0.0048326,-0.0062604,0.029453,0.0023112]],[[28,0.08366667,1,5,12,1.002124,-1,2,50,0.4642857,3,4,35,5.366667,-2,-3,34,140.125,-4,-5,12,0.647985,6,10,5,7.5,7,-10,23,7.5,8,-9,4,1878.195,-6,9,2,17.5,-7,-8,5,6.5,11,13,8,2.288601,12,-13,14,2712.5,-11,-12,19,0.5505051,-14,-15],[-0.00078203,-0.0090533,0.026508,-0.0059827,-0.023308,-0.00077705,-0.040334,-0.014787,0.0021009,0.0045795,0.025904,0.010292,0.0055516,-0.0047023,0.011345]],[[15,-1.190579,1,13,25,-2.96259,-1,2,9,5.068838,3,-13,21,0.6715,4,12,13,0.003541388,5,7,25,-1.265233,-2,6,3,1.5,-3,-4,18,0.4142857,8,9,13,0.2035521,-5,-6,25,-1.411807,-7,10,19,0.775,-8,11,6,14.5,-9,-10,4,1878.195,-11,-12,12,0.6392641,-14,-15],[0.011265,-0.015392,0.028679,0.0060726,0.0039121,0.035313,0.0018651,-0.0032169,-0.0011221,0.025506,-0.077524,0.0069804,-0.032381,-0.0042609,0.019584]],[[28,0.08366667,1,5,25,-1.246704,2,-5,12,0.9894663,-1,3,37,1.45,-2,4,14,1856.5,-3,-4,12,0.647985,6,10,38,0.2916667,7,-10,37,4.416667,8,-9,34,26.0,9,-8,12,0.292939,-6,-7,26,0.2295833,11,12,19,0.3923077,-11,-12,16,0.55,-13,13,24,-1.105789,-14,-15],[0.0026907,0.0051313,-0.041592,-0.010904,-0.0051955,-0.012547,0.046741,-0.013957,0.016053,0.0066154,-0.004077,0.0068314,-0.0014987,0.008443,0.026159]],[[31,0.9444444,1,8,30,4.708333,2,-8,21,0.0375,3,5,21,0.0325,4,-3,33,1501.167,-1,-2,20,-3.342644,-4,6,16,0.7083333,-5,7,37,1.45,-6,-7,16,0.7083333,9,-15,7,4.5,10,12,19,0.7321429,11,-11,20,-0.6435402,-9,-10,16,0.3666667,-12,13,24,-1.090094,-13,-14],[-0.01824,0.0035343,-0.03671,0.021371,0.01854,-0.0043024,0.0025898,-0.020088,-0.029203,0.010923,0.0042255,-0.022703,-0.0034232,0.016261,0.0037863]],[[31,0.9444444,1,6,6,9.5,2,4,9,5.167001,3,-3,10,0.6005464,-1,-2,8,2.027052,5,-6,4,18701.18,-4,-5,16,0.7083333,7,11,10,0.1201266,8,-11,37,1.916667,-7,9,6,26.5,10,-10,4,3777.3,-8,-9,6,4.5,-12,12,19,0.422619,-13,13,9,0.8740479,-14,-15],[-0.00072538,0.0076575,-0.026885,-0.050504,0.035464,-0.01184,0.012033,-0.075965,-0.01411,0.0060823,-0.012268,-0.0021198,-0.00016271,0.014702,0.0056822]],[[13,1e-35,1,2,15,-3.916438,-1,-2,31,0.7083333,3,-15,30,4.708333,4,-14,21,0.0605,5,7,4,1147.5,-3,6,21,0.0545,-4,-5,0,0.509,8,12,13,0.111606,9,10,11,-0.4988081,-6,-7,37,2.928571,11,-10,4,1874.5,-8,-9,13,0.2493618,13,-13,40,1e-35,-11,-12],[0.00020649,0.038225,-0.034984,-0.0013266,-0.023281,-0.0035406,0.013493,0.002706,-0.014393,0.0049128,-0.020886,0.0048654,0.014221,-0.019483,0.0016047]],[[28,0.1255,1,4,37,9.5,2,-4,25,-2.96259,-1,3,9,5.235563,-2,-3,13,0.2366947,5,9,24,-1.180848,6,8,5,6.5,-5,7,34,233.1667,-6,-7,50,0.5357143,-8,-9,23,7.5,10,13,32,0.467029,11,-13,5,7.5,12,-12,4,1874.5,-10,-11,19,0.6904762,-14,-15],[0.010276,-0.0016025,-0.035162,0.030648,0.0079545,0.0066487,-0.010251,0.035629,0.0112,0.0034388,-0.019595,0.0074503,-0.018706,0.0023709,0.029755]],[[33,5642.25,1,10,12,1.000001,2,6,8,-1e-35,-1,3,12,0.7324292,-2,4,40,1e-35,5,-5,37,1.45,-3,-4,32,0.782971,7,-10,20,-3.19611,-6,8,26,0.6695,9,-9,11,1.605888,-7,-8,5,7.5,11,13,2,22.5,-11,12,22,0.9622507,-12,-13,12,0.8089278,-14,-15],[0.044863,-0.0019832,0.00080044,-0.031294,0.0058943,-0.021199,-0.00154,0.0289,-0.062348,-0.026389,0.022575,0.010255,-0.021372,0.0078682,-0.0112]],[[28,0.1255,1,12,16,0.9,2,5,4,1702.575,-1,3,4,3665.332,-2,4,5,3.5,-3,-4,20,-2.403114,6,-12,4,4594.65,7,11,23,7.5,8,10,1,340.0,-5,9,15,-5.170227,-6,-7,21,0.1385,-8,-9,6,5.5,-10,-11,19,0.4365079,13,-15,24,-1.301871,-13,-14],[0.020633,-0.029923,-0.019884,-0.0018329,0.007624,-0.024319,-0.0046443,-0.016153,-0.056181,0.011758,-0.0072485,0.00086241,-0.0023278,0.011198,0.0082429]],[[33,5642.25,1,9,13,1e-35,2,3,15,-3.278116,-1,-2,20,-4.526531,-3,4,21,0.6715,5,-9,21,0.6605,6,-8,42,0.4166667,7,8,26,0.2431667,-4,-5,12,0.1267939,-6,-7,19,0.9375,10,-15,5,7.5,11,13,2,22.5,-10,12,22,0.9428105,-11,-12,12,0.8089278,-13,-14],[0.003232,0.042466,-0.035157,0.031357,-0.0061593,-0.011338,-0.00078217,0.019975,-0.035575,0.0218,0.0093889,-0.019333,0.004697,-0.012978,0.022658]],[[28,0.1305556,1,11,36,7.55,2,5,4,4664.0,3,-4,20,-2.684075,4,-3,24,-2.792832,-1,-2,4,2658.5,-5,6,0,0.249,-6,7,12,0.8126261,8,9,37,1.291667,-7,-8,37,3.708333,-9,10,33,4480.25,-10,-11,11,0.2168751,12,-15,26,0.2721667,13,-14,19,0.4365079,-12,-13],[-0.0025047,-0.020345,0.0010853,-0.0064332,-0.031352,0.026526,-0.0012904,0.014676,0.0057303,-0.038097,0.0059807,-0.0013099,0.0098186,0.015941,-0.0026056]],[[28,0.08366667,1,9,25,-1.246704,2,-9,39,9.733333,3,-8,13,0.3711269,4,8,37,1.291667,5,7,38,1.366667,6,-3,33,1054.167,-1,-2,4,1288.5,-4,-5,26,0.2681667,-6,-7,13,0.3361275,10,12,5,6.5,11,-12,8,2.288601,-10,-11,5,7.5,13,-15,37,4.416667,-13,-14],[-0.0069137,0.018517,-0.015126,-0.045627,-0.019356,0.010165,-0.0038749,0.0065461,-0.0048885,0.016132,0.0050403,-0.00097346,-0.013601,0.014125,0.0039076]],[[33,5642.25,1,11,28,0.1936667,2,6,18,0.3666667,-1,3,15,-6.745587,-2,4,16,0.3666667,5,-5,0,0.8221111,-3,-4,13,0.2300991,7,10,24,-1.180848,8,-9,26,0.2721667,9,-8,26,0.262125,-6,-7,6,2.5,-10,-11,24,-3.323693,-12,12,5,7.5,-13,13,4,6771.263,-14,-15],[0.015682,-0.019261,-0.031667,0.0062405,-0.0012731,0.0035066,-0.040201,0.019865,0.028647,-0.01184,0.0032222,0.035901,0.0098793,-0.040306,0.0012764]],[[33,5642.25,1,7,28,0.191,2,5,15,-6.863352,-1,3,25,-3.12918,-2,4,9,5.235563,-3,-4,24,-1.385835,-5,6,13,0.2199412,-6,-7,0,0.341,-8,8,19,0.6904762,9,-15,37,4.633333,10,13,24,-3.365408,-9,11,20,-2.829149,-10,12,0,0.529,-11,-12,21,0.0225,-13,-14],[-0.019744,0.012191,-0.0012915,-0.032451,0.00041935,0.021632,0.0011809,0.025542,0.031338,-0.018612,0.013606,-0.0050102,-0.054877,0.016129,0.020175]],[[12,1.116145,1,13,34,57.25,2,7,4,1773.0,3,6,20,-1.858795,4,-4,26,0.2681667,-1,5,21,0.4375,-2,-3,29,0.55,-5,-6,34,92.625,-7,8,4,1288.5,9,10,23,5.5,-8,-9,34,97.75,11,-13,40,0.7321429,-10,12,0,0.5557778,-11,-12,40,0.3666667,-14,-15],[-0.0013679,-0.056475,0.005498,0.012895,-0.035737,-0.0091288,0.0074305,-0.050648,0.0067851,-0.00074582,-0.060598,-0.0045999,0.00095702,-0.027233,-0.0019096]],[[33,5642.25,1,9,13,1e-35,2,3,39,9.45,-1,-2,24,-2.727018,4,-9,0,0.4326667,-3,5,26,0.08416667,6,8,5,9.5,-4,7,6,6.5,-5,-6,26,0.0891,-7,-8,5,7.5,10,13,0,0.341,11,12,40,0.4142857,-10,-11,21,0.0135,-12,-13,4,6847.208,-14,-15],[-0.0016038,0.03331,-0.010128,-0.015496,0.047301,-0.0097611,0.080765,0.010612,-0.00018848,0.045735,-0.027809,-0.042337,0.010129,-0.031307,0.0016793]],[[13,1e-35,1,2,25,-1.777012,-1,-2,31,0.7083333,3,7,6,16.5,4,-7,6,4.5,-3,5,0,0.407,6,-6,7,1e-35,-4,-5,16,0.55,8,9,24,-1.461737,-8,-9,6,3.5,10,12,0,0.407,-10,11,19,0.6458333,-11,-12,19,0.4365079,-13,13,21,0.4305,-14,-15],[-0.040635,0.02223,0.00097767,-0.00074744,-0.029098,-0.00084489,-0.021399,-0.036039,-0.0044854,0.00039678,-0.0045964,-0.035219,-0.00064044,0.0086577,-0.0099059]],[[33,5642.25,1,7,12,1.000001,2,5,8,1e-35,-1,3,16,0.2678571,4,-4,6,12.5,-2,-3,32,0.782971,6,-7,21,0.0215,-5,-6,19,0.9375,8,-15,24,-3.323693,-8,9,0,0.3442222,-9,10,20,-2.829149,-10,11,37,4.633333,12,-14,4,6084.5,-11,13,0,0.5326667,-12,-13],[0.043554,0.049572,-0.046001,-2.0142e-05,-0.021598,-0.00045414,-0.024088,0.031219,0.019356,-0.01921,-0.052505,0.014036,-0.0036468,0.014355,0.021157]],[[33,5642.25,1,9,28,0.1808333,2,8,20,-4.46634,-1,3,25,-3.12918,-2,4,9,5.235563,5,-7,21,0.6715,6,7,21,0.6605,-3,-4,4,1878.195,-5,-6,24,-1.180848,-8,-9,19,0.9375,10,-15,24,-3.323693,-10,11,2,31.5,-11,12,22,0.9459064,-12,13,26,0.234125,-13,-14],[-0.031696,0.010505,-0.0015234,0.017905,-0.072082,0.0082227,-0.030374,0.0015031,0.014676,0.029062,0.004825,0.00025009,-0.046794,0.00072435,0.020645]],[[33,5642.25,1,10,28,0.1808333,2,5,12,1.000001,3,4,16,0.3666667,-1,-2,36,9.1,-3,-4,13,0.2300991,6,8,38,4.416667,7,-7,20,-1.403291,-5,-6,36,3.708333,-8,9,6,2.5,-9,-10,19,0.6904762,11,-15,30,1e-35,-11,12,37,8.333333,13,-14,42,5.645833,-12,-13],[-0.018388,-0.00055882,-0.0049092,-0.034179,0.0061893,0.021455,-0.021886,0.0057504,-0.021125,-0.0024326,0.0094019,-0.0075195,0.016016,0.034623,0.019563]],[[21,1e-35,1,6,37,0.6333333,2,5,35,3.633333,3,4,48,0.9,-1,-2,38,0.7083333,-3,-4,38,2.583333,-5,-6,16,0.3666667,-7,7,31,0.9444444,8,10,6,16.5,-8,9,19,0.9375,-9,-10,6,3.5,-11,11,19,0.5227273,-12,12,20,-1.653887,-13,13,8,3.141945,-14,-15],[-0.031831,0.01481,0.026706,-0.00059343,-0.012195,-0.058697,-0.014535,-9.8279e-05,-0.024026,0.024771,-0.0034506,0.0022523,0.021737,0.0127,-0.0060573]],[[33,5642.25,1,-15,21,0.6715,2,13,21,0.6605,3,12,18,0.4142857,4,6,50,0.2916667,-1,5,12,0.7485033,-2,-3,4,17911.53,7,11,49,0.4166667,-4,8,21,0.2545,9,-8,34,505.8333,10,-7,38,5.416667,-5,-6,23,8.5,-9,-10,4,1489.5,-11,-12,4,1878.195,-13,-14],[-0.068319,0.038015,0.0066567,-0.0010822,0.020282,-0.040787,-0.0047026,-0.034148,-0.036641,-0.0032549,-0.041036,0.031034,-0.074891,0.010715,0.0048679]],[[13,1e-35,1,3,15,-3.278116,2,-3,43,0.7916667,-1,-2,21,1e-35,4,-15,37,0.6333333,5,8,35,3.633333,6,-7,48,0.9,-4,7,20,-3.391161,-5,-6,5,4.5,9,11,12,0.9063715,-8,10,22,0.6602564,-9,-10,37,2.225,12,-14,22,0.8603896,13,-13,24,-1.731531,-11,-12],[0.021755,-0.014437,0.041449,-0.030862,-0.022245,0.032397,0.012018,0.0097047,-0.0010816,-0.045793,-0.027849,0.0092342,-0.052391,-0.046412,0.00023765]],[[12,1.116145,1,13,15,-1.190579,2,12,49,0.875,3,5,33,8993.5,4,-3,27,0.7083333,-1,-2,33,8112.25,6,-11,20,-3.427021,7,8,6,9.5,-4,-5,31,0.9444444,9,-10,6,9.5,10,-9,5,9.5,11,-8,21,0.2545,-6,-7,13,0.3534728,-12,-13,39,4.472222,-14,-15],[-0.0074898,-0.0002703,0.016219,0.064317,-0.0043284,0.014036,-0.043461,-0.031806,-0.035475,0.018695,-0.027088,0.019061,-0.003973,-0.030822,-0.0010932]],[[34,55.25,1,10,4,1555.5,2,7,20,-1.858795,3,-6,26,0.173125,4,5,21,0.1145,-1,-2,26,0.1751,-3,6,26,0.2681667,-4,-5,5,6.5,8,9,0,0.249,-7,-8,21,0.4305,-9,-10,34,92.625,-11,11,4,1288.5,12,-15,35,4.9,-12,13,43,0.3666667,-13,-14],[-0.01512,0.015459,-0.084158,0.0045814,-0.03311,0.014165,-0.048769,-0.018031,0.01059,-0.01771,0.0063844,-0.052644,0.017147,-0.019369,0.00019089]],[[31,0.9444444,1,11,30,4.708333,2,10,26,0.31125,3,9,26,0.2981667,4,8,26,0.2845833,5,-5,16,0.6333333,-1,6,26,0.2681667,-2,7,34,110.125,-3,-4,40,0.6333333,-6,-7,2,21.5,-8,-9,7,1.5,-10,-11,16,0.55,12,-15,24,-1.180848,-12,13,20,-1.229508,-13,-14],[0.027189,-0.0018102,-0.054712,-0.0076462,0.015849,-0.014111,-0.065971,0.002287,0.021031,-0.0063538,-0.029702,-0.022087,0.021501,-0.0060267,0.0028581]],[[13,1e-35,1,2,15,-3.278116,-1,-2,34,850.3333,3,10,24,-2.727018,4,-10,10,0.385123,5,9,24,-2.792832,6,8,9,2.328654,7,-5,23,7.5,-3,-4,22,0.2546296,-6,-7,9,5.039693,-8,-9,4,6213.5,-11,11,2,18.5,-12,12,24,-3.347722,-13,13,20,-1.564991,-14,-15],[0.0047162,0.040826,0.0040596,-0.017301,-0.018021,-0.071718,-0.018271,0.0043131,-0.028406,0.00011209,-0.046428,0.022208,0.039028,-0.013337,0.012271]],[[33,5642.25,1,7,34,505.8333,2,4,49,0.4166667,-1,3,21,0.2545,-2,-3,4,7473.597,5,6,13,0.07816141,-4,-5,21,0.0505,-6,-7,19,0.6904762,8,-15,6,21.5,9,13,24,-3.323693,-8,10,37,4.291667,11,-12,4,6213.5,-9,12,4,6313.5,-10,-11,31,0.9444444,-13,-14],[-0.000599,0.014988,-0.032896,-0.0018484,-0.032058,-0.015608,0.006631,0.028045,-0.041671,0.037301,0.0011279,0.017472,-0.029101,-0.0014271,0.018481]],[[20,-4.526531,-1,1,13,1e-35,2,3,25,-1.777012,-2,-3,36,7.55,-4,4,4,2658.5,5,6,21,0.1005,-5,-6,0,0.243,7,11,21,0.2615,8,-11,21,0.1985,9,10,21,0.1495,-7,-8,21,0.2065,-9,-10,13,0.09929726,12,-15,4,4790.73,13,-14,34,343.0,-12,-13],[-0.031481,-0.034397,0.019953,-0.00096728,-0.010943,-0.046551,0.021434,-0.065683,0.074799,0.024914,-0.049674,-0.0025795,-0.045595,0.0019356,0.006281]],[[28,0.079,1,12,25,-1.246704,2,-12,40,0.9375,3,11,13,0.2915851,4,9,50,0.4642857,-1,5,35,4.45,6,7,34,79.5,-2,-3,34,140.125,8,-6,34,113.1667,-4,-5,20,-1.008391,10,-9,35,1.844444,-7,-8,11,0.3628258,-10,-11,26,0.2295833,13,-15,19,0.3484848,-13,-14],[0.010114,0.0096098,-0.043171,-0.022693,0.021884,-0.020082,-0.01005,0.0089475,-0.011053,0.010283,-0.0028146,-0.0048378,-0.0053901,0.0037063,0.0056486]],[[36,7.55,1,2,13,0.003541388,-1,-2,4,2658.5,3,4,21,0.1005,-3,-4,0,0.243,5,10,21,0.2615,6,-10,21,0.1985,7,9,21,0.1495,8,-7,4,2910.286,-5,-6,21,0.2065,-8,-9,13,0.09929726,11,13,4,4905.249,12,-13,34,416.4,-11,-12,37,1.916667,-14,-15],[0.0093815,-0.001264,-0.010178,-0.045248,-0.042336,0.027758,-0.061381,0.071401,0.024057,-0.048091,-0.004027,-0.045579,0.0023678,-0.0010374,0.010414]],[[36,7.55,1,-15,32,0.6881944,2,-14,12,0.7324292,3,7,5,7.5,4,6,39,9.733333,-1,5,0,0.259,-2,-3,26,0.6535,-4,-5,39,3.1,8,12,50,0.2916667,9,10,20,-2.808196,-6,-7,32,0.6405128,11,-10,23,5.5,-8,-9,16,0.7083333,-11,13,24,-1.374317,-12,-13],[-0.0021177,-0.036556,-0.012511,0.0063094,-0.030151,-0.022009,0.018077,-0.04136,-0.005806,0.017036,-0.0056154,0.0023293,0.016009,-0.0058224,0.0028252]],[[33,5642.25,1,7,28,0.1936667,2,5,15,-6.863352,-1,3,25,-2.96259,-2,4,9,5.235563,-3,-4,24,-1.374317,-5,6,13,0.2366947,-6,-7,19,0.6904762,8,-15,6,21.5,9,13,24,-3.420611,-8,10,37,4.291667,11,-12,4,6213.5,-9,12,0,0.3442222,-10,-11,31,0.9444444,-13,-14],[-0.019695,0.0096894,-0.001166,-0.031415,0.00016595,0.018243,0.0015915,0.030569,-0.04026,0.021503,-0.00030026,0.017282,-0.028287,-0.0015824,0.018004]],[[34,55.25,1,3,33,996.0556,2,-3,9,0.4426833,-1,-2,34,92.625,-4,4,34,164.5,5,-15,13,0.2691837,6,8,33,1028.167,7,-7,38,0.2916667,-5,-6,22,0.3900966,9,10,0,0.5173333,-8,-9,33,1279.167,-10,11,37,1.291667,12,13,5,5.5,-11,-12,21,0.4255,-13,-14],[0.012056,-0.0049176,-0.02563,0.0059469,-0.036087,0.0091055,0.0020709,-0.0035119,0.021547,0.00042125,-0.039955,-0.012735,-0.0051545,-0.030782,0.0015214]],[[21,0.6715,1,13,21,0.6605,2,11,31,0.775,3,4,6,16.5,-1,-2,6,3.5,5,7,0,0.403,-3,6,19,0.6458333,-4,-5,19,0.6904762,8,10,50,0.5357143,-6,9,3,1.5,-7,-8,6,21.5,-9,-10,4,1489.5,12,-13,0,0.083,-11,-12,4,1878.195,-14,-15],[-0.00055235,-0.019675,-0.00050108,-0.0036501,-0.034553,0.0064192,0.0025962,-0.0052346,0.0060663,0.024499,0.041044,-0.062484,0.029042,-0.072068,0.01021]],[[12,1.116145,1,13,34,67.16667,2,6,4,1878.195,3,4,20,-1.537967,-1,-2,2,15.5,5,-5,4,3705.5,-3,-4,4,1015.247,7,8,34,137.1,-6,-7,34,92.625,9,10,4,7750.0,-8,-9,4,1288.5,11,12,34,99.16667,-10,-11,34,97.75,-12,-13,39,4.55,-14,-15],[-0.0010097,0.013274,-0.035875,-0.00036099,-0.0021639,-0.032115,0.020583,0.012355,-0.012428,0.034276,-0.033307,-0.011545,0.00086644,-0.028141,-0.0018352]],[[18,0.4142857,1,3,0,0.3826667,2,-3,26,0.139125,-1,-2,33,5642.25,4,9,32,0.6802778,-4,5,26,0.24925,6,-9,26,0.1381667,7,-8,26,0.133125,-5,8,37,0.9444444,-6,-7,5,7.5,10,12,2,22.5,-10,11,22,0.9591667,-11,-12,12,0.8089278,13,-15,50,0.6904762,-13,-14],[0.027409,-0.053115,0.015318,0.00017848,-0.005125,-0.051046,0.039386,-0.016478,0.0027288,0.01756,0.0087339,-0.015392,-0.010617,0.011313,-0.010724]],[[28,0.079,1,12,25,-1.246704,2,-12,40,0.9375,3,10,13,0.3754593,4,8,37,1.45,5,7,38,1.366667,6,-3,33,1054.167,-1,-2,13,0.180111,-4,-5,23,1.5,-6,9,20,-0.9315504,-7,-8,2,7.5,11,-11,13,0.2300991,-9,-10,26,0.2721667,13,-15,21,0.2695,-13,-14],[-0.0063787,0.014585,-0.012095,-0.031675,-0.01071,-0.011381,0.0088608,-0.010631,0.022787,-0.0089463,0.0029651,-0.0047058,0.00032963,-0.046029,0.0065193]],[[25,-2.96259,-1,1,9,5.235563,2,-15,28,0.079,3,7,11,-0.5345833,-2,4,13,0.04540883,5,6,39,9.733333,-3,-4,25,-1.254181,-5,-6,4,1461.0,8,9,24,-2.352972,-7,-8,11,0.2554128,10,12,5,6.5,-9,11,10,0.04509887,-10,-11,36,9.225,13,-14,38,5.416667,-12,-13],[0.0094457,-0.0085681,-0.0053944,0.022812,0.00096418,-0.0043844,-0.004582,0.019195,0.00573,-0.0068171,0.0043645,-0.0075198,0.0095955,0.015612,-0.030405]],[[13,1e-35,1,2,15,-3.278116,-1,-2,20,-2.428472,3,8,10,0.3501269,4,7,9,2.049693,5,-6,20,-2.548917,6,-5,10,0.1101181,-3,-4,21,0.0205,-7,-8,28,0.29125,9,12,18,0.4142857,10,11,12,0.7485033,-9,-10,34,850.3333,-11,-12,9,0.8223952,13,-15,11,0.8634694,-13,-14],[0.0046833,0.039928,-0.0045495,0.0086552,-0.016576,-0.013318,-0.010526,0.0053557,0.037696,0.0064453,-0.00041141,0.0094435,0.018071,-0.017613,-0.0050598]],[[21,0.6715,1,13,21,0.6605,2,11,21,0.6555,3,10,25,-2.96259,-1,4,9,5.342575,5,-8,28,0.079,-2,6,4,1461.0,7,8,20,-2.428472,-3,-4,14,1973.5,9,-7,2,4.5,-5,-6,4,861.5,-9,-10,4,1489.5,12,-13,0,0.083,-11,-12,4,1878.195,-14,-15],[0.0091547,-0.0016004,-0.0065539,0.020521,-0.03188,-0.0042594,0.0021243,-0.032247,0.026109,-0.056269,0.039833,-0.061267,0.027557,-0.070167,0.0085864]],[[13,1e-35,1,3,33,1501.167,2,-3,43,1.225,-1,-2,33,5642.25,4,6,11,-1.285069,5,-6,18,0.7083333,-4,-5,19,0.6904762,7,-15,2,26.5,8,12,36,7.416667,9,10,13,0.2729105,-7,-8,21,0.0255,-9,11,2,8.5,-10,-11,32,0.9433761,13,-14,29,0.4166667,-12,-13],[0.0098005,-0.038492,0.026847,0.0016364,-0.017748,-0.00035739,-0.014411,0.012495,0.041695,-0.085501,0.0086,0.023101,-0.002515,-0.020182,0.016978]],[[15,-1.190579,1,13,20,-4.526531,-1,2,25,-2.96259,-2,3,9,5.342575,4,-13,28,0.1229167,5,-12,25,-0.08307347,6,-11,16,0.9,7,9,5,3.5,-3,8,10,0.1301042,-4,-5,37,5.833333,-6,10,4,4854.5,11,-10,34,448.25,-7,12,20,-3.300076,-8,-9,13,0.07560621,-14,-15],[-0.02964,0.0085757,-0.021808,0.0067619,-0.0090944,-0.00057213,0.0007785,0.061298,-0.046408,0.017903,-0.010764,0.0019369,-0.029443,0.028949,0.002223]],[[31,0.775,1,5,6,9.5,-1,2,2,22.5,3,4,7,1e-35,-2,-3,6,21.5,-4,-5,6,3.5,6,7,0,0.181,-6,-7,19,0.6904762,8,13,32,0.4220648,-8,9,15,-4.761256,-9,10,2,20.5,11,12,36,4.472222,-10,-11,27,0.9444444,-12,-13,20,-0.9501276,-14,-15],[0.00035087,-6.9653e-11,-0.031131,0.0031122,-0.022113,0.0055455,-0.0071375,0.0076156,-0.010208,-0.003538,0.01253,-0.030898,-0.00096903,0.016311,-0.0013982]],[[33,5642.25,1,-15,32,0.8066239,2,7,12,0.7324292,3,4,34,175.1667,-1,-2,40,1e-35,5,-6,37,1.45,6,-5,20,-2.877225,-3,-4,40,0.7321429,8,10,12,0.7364633,-7,9,4,4790.73,-8,-9,21,0.0125,-10,11,21,0.3635,12,-14,34,490.5,13,-13,2,7.5,-11,-12],[-0.0039547,0.0073831,-0.020694,0.0089395,-0.025398,0.004113,-0.0002328,-0.037945,-0.011237,-0.039951,0.02352,-0.0011802,0.024483,-0.038736,0.0041601]],[[34,55.25,1,6,4,1555.5,2,3,24,-1.715112,-1,-2,2,17.5,4,5,4,3705.5,-3,-4,4,7848.2,-5,-6,4,1077.0,7,9,26,0.32125,8,-9,24,-2.838904,-7,-8,34,92.625,10,12,26,0.1401667,-10,11,26,0.2155833,-11,-12,4,1288.5,13,-15,34,99.16667,-13,-14],[-0.0038435,0.013139,-0.031027,-0.00090553,0.015576,-0.034846,-0.027687,0.0074054,-0.057174,0.013302,-0.021252,0.006191,0.022964,-0.031486,0.00018165]],[[16,0.3666667,1,3,0,0.951,2,-3,48,0.6333333,-1,-2,24,-1.374317,4,7,15,-3.098296,5,-7,21,1e-35,6,-6,0,0.149,-4,-5,28,0.281,8,-15,12,0.6890672,-8,9,39,3.1,10,12,50,1e-35,-9,11,6,7.5,-10,-11,16,0.7083333,13,-14,7,4.5,-12,-13],[-0.02617,0.029217,0.017383,-0.037855,-0.0051633,0.0014896,-0.0049956,-0.0017338,0.021297,-0.028256,-0.00062706,-0.013766,0.0050463,0.011567,0.01871]],[[26,0.6715,1,13,15,-1.190579,2,12,18,0.4142857,3,9,6,27.5,4,8,37,0.2916667,-1,5,26,0.1161667,-2,6,0,0.3826667,-3,7,2,19.5,-4,-5,45,1e-35,-6,-7,34,850.3333,-8,10,4,6213.5,-9,11,2,21.5,-10,-11,11,-0.4359922,-12,-13,4,1878.195,-14,-15],[-0.044496,0.034269,-0.0375,0.034678,-0.0030887,-0.012351,0.032237,-0.00074157,-0.041993,0.015872,-0.0031318,0.031057,0.0028555,-0.068946,0.0090822]],[[33,5642.25,1,12,28,0.29125,2,9,18,0.4142857,-1,3,4,17911.53,4,5,25,-3.12918,-2,-3,23,8.5,6,7,7,2.5,-4,-5,27,0.775,-6,8,45,0.4642857,-7,-8,10,1e-35,-9,10,0,0.471,-10,11,21,0.0425,-11,-12,19,0.9375,13,-15,6,23.5,-13,-14],[0.0098101,0.0097882,-0.0010521,-0.056164,-0.015681,-0.049732,-0.016236,0.0098027,0.018133,-0.0052192,-0.013024,0.021976,0.005205,-0.0056182,0.016886]],[[26,0.6715,1,13,24,-1.374317,2,9,26,0.6555,3,-8,26,0.6105,4,-7,19,0.4083333,5,-6,6,5.5,6,7,2,14.5,-1,-2,23,9.5,8,-5,2,19.5,-3,-4,10,0.06012048,-9,10,20,-0.9315504,11,12,24,-0.8198257,-10,-11,19,0.4494949,-12,-13,4,1878.195,-14,-15],[-0.0022154,0.0061914,-0.021606,-0.0072482,0.00063354,0.0031237,0.027638,-0.053942,0.0050268,-5.2531e-05,0.053545,0.0071633,-0.020839,-0.068138,0.0087744]],[[36,7.55,1,7,32,0.6310069,-1,2,21,0.4355,3,-7,21,0.2315,4,6,39,3.775,5,-4,21,0.1395,-2,-3,2,9.5,-5,-6,39,9.583333,8,13,2,10.5,9,11,5,9.5,10,-10,14,4709.5,-8,-9,5,3.5,12,-13,26,0.1371667,-11,-12,20,-2.829149,-14,-15],[0.00033637,0.0039542,-0.031953,-0.0099942,0.020989,-0.00012753,-0.049602,-0.020327,0.031037,-0.064979,0.0029819,-0.01879,0.004143,-0.012693,0.0072384]],[[25,-2.96259,-1,1,9,5.342575,2,-15,28,0.1235417,3,10,15,-4.770918,4,8,37,1.775,-2,5,40,0.775,6,7,11,0.2614595,-3,-4,20,-2.569015,-5,-6,37,9.5,9,-9,25,-0.07325552,-7,-8,19,0.3484848,11,-14,37,2.633333,12,13,43,7.1625,-10,-11,30,2.366667,-12,-13],[0.0084288,-0.00084086,-0.023516,0.0053042,0.016768,-0.011759,-5.4716e-05,-0.0077882,0.025677,-0.0020776,-0.021015,0.011762,-0.012755,0.0056321,-0.030265]],[[13,1e-35,1,3,15,-3.23054,2,-3,43,0.7916667,-1,-2,36,7.55,-4,4,4,2658.5,5,8,32,0.6160256,6,-8,20,-2.147399,7,-7,26,0.06875,-5,-6,0,0.243,9,-15,26,0.262125,10,-14,26,0.1971,11,13,26,0.150125,12,-11,4,2910.286,-9,-10,26,0.2061,-12,-13],[0.01983,-0.012578,0.038819,-0.00091038,0.02688,-0.047815,0.032812,-0.039113,-0.045251,0.024806,-0.079216,0.065874,0.018635,-0.057109,0.0027465]],[[13,1e-35,1,3,15,-6.745587,-1,2,25,-1.050307,-2,-3,12,1.116145,4,13,16,0.2678571,5,6,19,0.3923077,-4,-5,34,67.16667,7,10,4,1288.5,8,9,20,-2.772448,-6,-7,2,15.5,-8,-9,4,1015.247,11,12,34,137.1,-10,-11,34,92.625,-12,-13,42,2.828571,-14,-15],[-0.042319,-0.0046694,0.026341,0.042419,-0.0388,-0.0093008,0.010235,-0.016982,0.0014136,-0.029346,0.023377,0.008681,6.0939e-05,-0.016063,0.0082101]],[[13,0.003541388,1,4,25,-0.9187054,-1,2,10,0.2450166,3,-4,12,1.000001,-2,-3,37,4.125,-5,5,12,0.7978329,6,7,6,15.5,-6,-7,33,4634.25,8,9,36,8.733333,-8,-9,33,8112.25,10,-15,21,0.1385,11,12,36,7.291667,-10,-11,21,0.212,-12,13,30,1.708333,-13,-14],[-0.0075912,0.024784,0.0023929,-0.0058952,-0.00069217,0.021662,0.0048335,-0.00015147,-0.036795,-0.040504,0.021912,-0.025025,0.020738,-0.013737,0.031608]],[[13,0.003541388,1,3,10,0.2450166,2,-3,12,1.000001,-1,-2,20,-4.603324,-4,4,37,4.125,5,6,42,0.4166667,-5,-6,12,0.8341359,7,8,6,20.5,-7,-8,33,4561.25,9,10,34,327.25,-9,-10,33,8112.25,11,-15,6,7.5,12,-14,2,18.5,13,-13,0,0.615,-11,-12],[0.016863,-0.0014088,-0.0095652,-0.034192,0.011098,-0.00076656,0.018347,0.0021588,0.010178,-0.036744,0.0080926,-0.041842,0.028628,-0.010766,0.029159]],[[33,3236.167,1,10,4,7565.58,2,7,35,8.291667,3,4,15,-1.190579,-1,-2,2,7.5,-3,5,4,2078.045,-4,6,2,14.5,-5,-6,40,0.6904762,8,9,34,99.16667,-7,-8,6,18.5,-9,-10,4,4790.73,11,12,34,343.0,-11,-12,37,4.125,-13,13,11,-0.3491638,-14,-15],[0.00010101,0.010675,-0.047849,0.024449,-0.033342,-0.0047451,-0.019192,0.0017824,-0.026893,-0.007682,0.012211,-0.033468,0.0011188,-0.0053304,0.01358]],[[16,0.3666667,1,3,0,0.949,2,-3,48,0.6333333,-1,-2,24,-1.216559,4,9,15,-3.098296,-4,5,4,1368.77,-5,6,35,1.844444,-6,7,19,0.9375,8,-9,21,0.3455,-7,-8,8,3.102337,10,13,12,0.7851243,-10,11,39,3.1,-11,12,16,0.6333333,-12,-13,21,0.4315,-14,-15],[-0.024804,0.028028,0.016944,0.00078874,0.0082272,-0.024794,-0.0077122,0.0034785,0.008501,0.001025,-0.0060917,-0.0030686,0.016944,0.00021865,-0.015264]],[[21,0.6715,1,13,21,0.6605,2,11,33,3236.167,3,7,4,10756.5,4,5,24,-0.5529546,-1,-2,24,-0.6161311,6,-5,14,5415.5,-3,-4,5,7.5,8,9,0,0.4826667,-6,-7,4,7080.595,10,-10,21,0.1045,-8,-9,4,1489.5,12,-13,0,0.083,-11,-12,4,1878.195,-14,-15],[-0.00061644,0.014157,-0.016905,0.0039702,-0.052266,0.012876,0.0027445,-0.0067205,-0.030328,0.0011846,0.037324,-0.056876,0.024996,-0.06632,0.0078716]],[[25,-2.96259,-1,1,9,5.342575,2,-15,28,0.1255,3,7,16,0.9,4,-6,5,3.5,-2,5,4,1878.195,-3,6,4,3584.5,-4,-5,24,-1.374317,8,12,5,5.5,9,-11,12,0.6437408,-7,10,20,-2.189327,-8,11,20,-1.898624,-9,-10,28,0.2658333,13,-14,21,0.6105,-12,-13],[0.008017,-0.0195,0.021194,-0.027856,-0.0012612,-0.00035331,-0.006424,0.00014143,0.02125,0.0051125,-0.0035165,0.0049833,-0.028883,0.016205,-0.029261]],[[27,0.9444444,1,-15,37,0.6333333,2,6,34,33.625,3,4,35,2.9,-1,-2,9,3.340748,5,-5,0,0.831,-3,-4,22,0.2649123,7,8,20,-2.260635,-6,-7,1,340.0,9,10,4,2867.5,-8,-9,0,0.6836667,11,13,29,0.55,-10,12,6,9.5,-11,-12,50,0.9166667,-13,-14],[-0.068534,0.013857,0.017497,-0.013555,-0.013953,-0.02006,0.046364,-0.016582,0.022436,-0.022739,0.041032,-0.0076292,-0.0053987,-0.044155,0.00032877]],[[31,0.775,1,6,29,0.4166667,2,3,16,0.9,-1,-2,7,1.5,4,5,48,0.775,-3,-4,20,-1.935953,-5,-6,16,0.7083333,7,-15,7,4.5,8,11,24,-1.118776,-7,9,4,1923.678,-8,10,4,3777.3,-9,-10,16,0.3666667,-11,12,24,-1.090094,-12,13,26,0.35525,-13,-14],[0.020717,0.00056589,-0.0033819,0.027897,-0.010179,-0.029054,-0.026271,0.032833,-0.03733,-0.001567,-0.018668,-0.0023142,0.024115,-0.0036825,0.0025956]],[[13,0.003541388,1,2,25,-0.9187054,-1,-2,20,-4.603324,-3,3,25,-2.96259,-4,4,37,2.585714,-5,5,4,1878.195,6,9,21,0.1375,7,8,21,0.1235,-6,-7,32,0.4966667,-8,-9,16,0.7083333,-10,10,21,0.2795,11,-15,21,0.2705,12,-14,37,3.267857,13,-13,4,2658.5,-11,-12],[-0.007563,0.013704,-0.03334,0.0077343,-0.0012458,-0.012907,0.053312,-0.072509,-0.023233,-0.0080059,-0.016084,0.017123,-0.00014209,-0.029301,0.013498]],[[12,1.116145,1,11,36,7.55,-1,2,40,0.9375,3,10,21,0.0675,4,5,0,0.3268889,-2,-3,12,0.6302976,-4,6,18,0.7083333,7,9,24,-1.052812,8,-7,37,3.875,-5,-6,34,850.3333,-8,-9,24,-2.81442,-10,-11,42,2.291667,12,-15,32,0.3920807,-12,13,6,5.5,-13,-14],[-0.00054684,0.023067,0.0012438,0.0069251,0.0059693,-0.04051,0.044719,-0.025235,-0.0043355,-0.016529,0.0072065,0.0050855,-0.033902,-0.0075092,0.0071171]],[[21,1e-35,1,-15,37,0.6333333,2,8,34,33.625,3,4,35,2.9,-1,-2,0,0.1663333,5,6,20,-1.638156,-3,-4,0,0.831,7,-7,33,3279.75,-5,-6,22,0.2649123,9,10,20,-2.260635,-8,-9,1,340.0,11,12,20,-1.285917,-10,-11,33,4561.25,13,-14,35,8.366667,-12,-13],[-0.067571,0.013757,-0.03664,0.028842,0.0079708,0.031748,-0.012083,-0.019302,0.043647,0.010352,-0.037201,-0.02099,0.0071662,-0.054356,0.00032128]],[[20,-4.674669,-1,1,13,1e-35,2,5,15,-3.23054,3,-5,43,1.225,4,-4,33,844.25,-2,-3,26,0.6695,6,13,26,0.6655,7,11,33,5413.5,-6,8,19,0.6904762,9,-10,6,21.5,10,-9,43,4.916667,-7,-8,4,1489.5,-11,12,4,3513.5,-12,-13,4,1878.195,-14,-15],[-0.035218,-0.016192,0.026368,-0.017947,0.037561,-0.00060074,0.0022257,0.015972,-0.0062327,0.015314,-0.023397,0.034676,-0.043379,-0.052821,0.013978]],[[13,0.003541388,1,3,25,-1.19562,-1,2,10,0.2450166,-2,-3,36,7.55,-4,4,4,2658.5,5,9,32,0.6160256,6,-9,20,-2.147399,7,-8,26,0.06875,8,-7,26,0.02125,-5,-6,0,0.243,10,-15,26,0.262125,11,-14,26,0.1971,12,13,26,0.150125,-10,-11,26,0.2061,-12,-13],[-0.011663,0.015899,-0.0088812,-0.00097783,-0.029445,0.060994,-0.044492,0.03175,-0.036746,0.016044,-0.076113,0.063176,0.017858,-0.062045,0.0024466]],[[13,1e-35,1,3,15,-3.23054,2,-3,43,0.7916667,-1,-2,27,0.9444444,4,9,4,14196.0,5,-9,12,0.8956073,6,7,9,3.340748,-4,-5,49,0.4166667,8,-8,22,0.644958,-6,-7,37,1.083333,10,13,4,1874.5,-10,11,6,4.5,12,-13,21,0.0935,-11,-12,4,1773.0,-14,-15],[0.019233,-0.012833,0.03666,0.0057041,-0.0127,-0.006215,-0.03215,0.018375,-0.031687,0.006412,-0.0018854,-0.017606,-0.00025538,-0.021004,0.0034699]],[[18,0.4142857,1,8,36,8.45,2,-8,6,27.5,3,7,37,0.2916667,4,5,29,0.9444444,-1,-2,21,0.1475,-3,6,24,-1.407079,-4,-5,12,0.7364633,-6,-7,36,7.55,-9,9,4,2658.5,10,11,32,0.6160256,-10,-11,0,0.243,12,-15,21,0.2615,13,-14,21,0.1985,-12,-13],[-0.075558,0.0058176,0.010577,-0.069083,0.02917,0.048084,0.01438,-0.049943,-0.00088629,-0.0025417,-0.036542,0.0081425,0.03733,-0.047153,0.0023952]],[[18,0.4142857,1,3,13,0.2612707,2,-3,36,8.45,-1,-2,25,-2.899306,-4,4,9,5.342575,5,-15,24,-1.090094,6,10,25,-1.572033,-5,7,19,0.4365079,8,-9,6,5.5,-6,9,14,3762.5,-7,-8,20,-1.335069,-10,11,8,3.102337,12,13,18,0.9444444,-11,-12,19,0.2928571,-13,-14],[0.0055826,-0.054767,0.027977,0.0069401,0.0027059,-0.00027217,-0.016215,-0.0039298,0.00095526,0.019279,0.024967,0.0036566,0.014171,-0.012339,-0.02851]],[[21,0.6715,1,13,21,0.6605,2,10,21,0.6555,3,9,33,3236.167,4,5,4,17265.39,-1,-2,5,7.5,-3,6,4,7473.597,7,-7,21,0.1045,-4,8,2,13.5,-5,-6,4,861.5,-8,-9,4,1489.5,11,12,0,0.083,-10,-11,16,0.9,-12,-13,4,1878.195,-14,-15],[-0.00050141,-0.024371,0.0051336,-0.0031553,-0.067834,-0.020717,0.0011823,0.026025,-0.051784,0.038401,-0.0516,-0.020889,0.027669,-0.063245,0.0066961]],[[18,0.4142857,1,3,4,21755.98,2,-3,15,-4.74265,-1,-2,15,-6.745587,-4,4,25,-2.899306,-5,5,9,5.342575,6,-15,24,-1.090094,7,9,30,12.55,-6,8,19,0.7321429,-7,-8,20,-1.335069,10,11,0,0.8615556,-9,-10,8,3.102337,12,13,18,0.9444444,-11,-12,19,0.2928571,-13,-14],[0.00014504,0.027996,0.039474,-0.011084,0.0070565,-0.00053955,-0.023079,0.015383,0.026856,-0.0047526,0.023883,0.0034853,0.01388,-0.011736,-0.027052]],[[28,0.1305556,1,8,25,-1.572033,2,3,24,-0.9342811,-1,-2,24,-1.090094,4,-8,21,0.3455,5,7,21,0.2985,-3,6,13,0.471507,-4,-5,6,18.5,-6,-7,11,0.2554128,9,-15,5,6.5,10,-14,37,6.416667,11,-13,21,0.276,12,-12,21,0.2705,-9,13,24,-1.035583,-10,-11],[0.0031197,-0.0084782,-0.0034645,-0.041449,-0.0011085,0.0074888,-0.034187,0.0025785,0.0069103,-0.060083,0.025466,0.02032,-0.016327,-0.00098299,-0.0021237]],[[28,0.1255,1,7,16,0.9,2,-7,5,3.5,3,4,31,0.7083333,-1,-2,4,1702.575,-3,5,4,3542.555,6,-6,34,26.0,-4,-5,19,0.4083333,8,12,21,0.2005,9,10,21,0.1545,-8,-9,9,0.8223952,-10,11,15,-4.664151,-11,-12,6,5.5,13,-15,34,137.1,-13,-14],[0.0065339,-0.023744,0.022396,0.037211,-0.030194,-0.0013001,-0.00013907,-0.0012808,-0.021164,0.0093038,0.021521,-0.011346,0.0062929,-0.020091,0.0077233]],[[28,0.1255,1,13,16,0.9,2,9,4,1878.195,-1,3,4,3542.555,4,5,34,26.0,-2,-3,29,1e-35,-4,6,24,-1.090094,7,8,36,3.366667,-5,-6,21,0.1495,-7,-8,37,5.833333,10,11,4,5363.515,-9,-10,4,5363.515,12,-13,26,0.11425,-11,-12,9,3.238265,-14,-15],[0.015586,0.028841,-0.033411,0.01717,0.011041,-0.019875,0.015946,-0.0036992,0.00049672,-0.0031814,0.008331,-0.02596,0.015777,0.0022842,-0.019332]],[[31,0.775,1,-15,30,4.708333,2,-14,21,0.1055,3,5,20,-2.548917,4,-3,4,1461.0,-1,-2,21,0.1385,6,8,4,1874.5,7,-6,43,0.7916667,-4,-5,21,0.1965,9,11,4,1077.0,-7,10,2,5.5,-8,-9,2,20.5,12,-13,21,0.2435,-10,13,24,-2.070556,-11,-12],[-0.017753,0.0014452,-0.01548,0.012272,0.050519,0.0076159,0.0067609,-0.037361,-0.0090954,0.016201,-0.016173,0.00069346,0.014317,-0.016638,0.0011622]],[[34,67.16667,1,7,4,1878.195,2,3,19,0.3923077,-1,-2,5,7.5,4,6,2,15.5,5,-5,27,0.6333333,-3,-4,24,-1.067786,-6,-7,4,1077.0,8,11,35,5.9,9,10,22,0.245,-8,-9,26,0.135125,-10,-11,36,2.9,12,-15,37,2.291667,-12,13,26,0.1371667,-13,-14],[-0.0011127,0.012094,0.010688,-0.038449,-0.0070611,0.013147,-0.012951,-0.0017784,-0.046662,-0.016158,0.030898,0.015753,0.0046159,-0.045255,7.5785e-05]],[[13,1e-35,1,3,15,-3.23054,2,-3,43,1.225,-1,-2,27,0.9444444,4,-15,43,1e-35,5,7,34,33.625,6,-6,35,2.9,-4,-5,5,7.5,8,13,32,0.6093478,9,12,34,124.75,10,11,22,0.2679487,-7,-8,13,0.07560621,-9,-10,35,8.366667,-11,-12,5,9.5,-13,-14],[0.014963,-0.016384,0.036514,-0.067463,0.013943,0.0066824,0.0209,-0.013507,-0.014159,0.034443,-0.03531,0.0039198,-0.063872,-0.012498,0.00017721]],[[33,3151.167,1,2,4,17265.39,-1,-2,5,7.5,3,7,0,0.4826667,4,6,49,0.875,-3,5,4,10447.77,-4,-5,21,0.3635,-6,-7,13,0.2766461,8,10,19,0.3038462,9,-10,10,0.6658333,-8,-9,38,9.416667,11,12,34,370.25,-11,-12,4,14196.0,-13,13,19,0.08514493,-14,-15],[-0.00050204,-0.026123,0.0074297,0.030686,-0.028789,0.0030268,-0.025074,-0.017272,0.020573,-0.0015569,0.012799,-0.0044593,-0.0011028,0.057882,0.011483]],[[33,3151.167,1,9,4,17265.39,2,8,32,0.826505,3,-7,4,6213.5,-1,4,5,8.5,5,-6,23,7.5,6,7,6,15.5,-2,-3,28,0.1536667,-4,-5,6,41.5,-8,-9,5,7.5,10,12,20,-3.440047,-10,11,26,0.3631667,-11,-12,12,0.6302976,-13,13,18,0.7638889,-14,-15],[0.00054715,-0.026685,-0.0070653,-0.0072206,0.016016,0.0051564,-0.01107,-0.038189,0.00060966,0.029474,0.0045226,-0.016814,0.0066818,0.00076977,-0.010679]],[[20,-4.674669,-1,1,18,0.4142857,2,7,13,0.2612707,3,5,36,8.45,4,-4,26,0.2845833,-2,-3,30,1.708333,-5,6,20,-2.375678,-6,-7,25,-2.899306,-8,8,20,-0.5521725,9,11,28,0.089,10,-11,11,-0.5345833,-9,-10,4,11196.95,12,13,26,0.6695,-12,-13,22,0.8297101,-14,-15],[-0.032817,0.0064385,-0.052859,-0.05089,-0.025631,-0.022064,0.035444,0.0064102,-0.0076487,-0.00050704,0.00088502,0.016705,-0.045481,-0.055663,0.008073]],[[13,0.003541388,1,7,15,-2.042366,2,-7,37,1.916667,3,5,42,1.225,4,-3,15,-6.745587,-1,-2,18,0.7638889,-4,6,33,1866.25,-5,-6,36,7.55,8,9,32,0.6881944,-8,-9,12,0.9199736,10,11,37,1.083333,-10,-11,5,7.5,12,-15,33,6251.5,13,-14,39,9.583333,-12,-13],[-0.045102,0.026216,-0.0028964,0.004754,-0.0475,-0.010771,0.027835,-8.7094e-05,-0.0051899,-0.0004018,0.0072427,-0.017104,0.0028376,0.01607,-0.01598]],[[13,0.003541388,1,8,49,1e-35,2,-8,40,0.4142857,3,5,42,1.225,4,-3,33,1323.25,-1,-2,4,1878.195,-4,6,24,-1.31372,-5,7,16,0.6333333,-6,-7,36,7.55,-9,9,4,2658.5,10,12,22,0.6172161,11,-12,24,-2.147404,-10,-11,0,0.243,13,-15,26,0.262125,-13,-14],[-0.017788,0.016791,-0.028834,0.025925,-0.002836,-0.0049992,0.02844,0.024763,-0.00090573,-0.018885,0.030275,-0.03376,0.020688,-0.059018,0.0021307]],[[13,0.003541388,1,5,50,1e-35,2,4,33,871.1667,-1,3,12,1.000001,-2,-3,14,1302.5,-4,-5,20,-4.603324,-6,6,11,-1.285069,7,13,4,4440.5,8,12,34,130.5833,9,-11,40,0.5857143,10,-10,33,1034.167,11,-9,34,79.5,-7,-8,6,1.5,-12,-13,16,0.2678571,-14,-15],[-0.0067736,0.036596,0.00056464,-0.0275,0.0046711,-0.031366,-0.0015487,-0.045079,0.012288,-0.01986,-0.024671,0.035452,-0.0014827,-0.019151,0.0001153]],[[21,0.6695,1,12,26,0.6655,2,-12,18,0.4142857,3,10,50,0.2916667,-1,4,30,10.36667,5,-8,4,17911.53,6,8,6,42.5,7,-4,4,16754.5,-2,-3,0,0.8663333,-5,9,30,4.55,-6,-7,25,-2.795782,11,-11,4,1674.167,-9,-10,4,1878.195,-13,13,3,1.5,-14,-15],[-0.058783,0.0073773,-0.060521,-0.062565,0.046842,0.036928,-0.055208,0.03791,-0.0071835,0.0094331,-0.00044098,0.023448,-0.050765,0.023923,-0.040622]],[[34,67.16667,1,2,9,0.4426833,-1,-2,34,92.625,-3,3,26,0.5965,4,-15,35,2.633333,5,7,26,0.3241667,-4,6,0,0.259,-5,-6,26,0.5215,8,13,34,170.1667,9,11,12,0.7523954,10,-9,33,1066.25,-7,-8,26,0.4555,12,-12,26,0.4345,-10,-11,0,0.101,-13,-14],[0.0060936,-0.0049397,0.0059698,0.016394,0.0091933,-0.026899,0.0045422,-0.010268,0.00087757,0.0011058,0.028405,-0.039364,0.0032557,-0.060076,-0.043225]],[[31,0.775,1,8,6,16.5,2,6,6,4.5,-1,3,2,19.5,4,5,7,1e-35,-2,-3,35,2.416667,-4,-5,7,1.5,-6,7,18,0.3666667,-7,-8,6,2.5,-9,9,32,0.4220648,-10,10,15,-4.761256,-11,11,34,175.1667,12,13,13,0.1596158,-12,-13,2,18.5,-14,-15],[0.0013534,3.3697e-10,-0.022915,-0.023819,0.0053467,-0.00678,0.036925,-0.029472,-0.005282,0.0075192,-0.0079724,0.0055214,-0.0063355,0.015116,0.0012344]],[[18,0.4142857,1,-15,6,27.5,2,11,37,0.2916667,3,5,21,0.0735,4,-3,20,-1.73256,-1,-2,26,0.1195833,-4,6,24,-1.616121,7,-10,22,0.787594,-5,8,4,9508.688,-6,9,24,-1.840856,-7,10,21,0.0275,-8,-9,45,0.225,-11,12,26,0.1231667,13,-14,35,8.366667,-12,-13],[-0.080783,0.0067031,0.019096,0.02559,-0.055786,0.042082,0.025942,0.017388,-0.06107,0.013043,-0.011443,-0.053434,0.035172,0.032546,-0.00015982]],[[12,1.116145,1,10,28,0.1305556,-1,2,19,0.422619,3,9,26,0.2001667,4,7,21,0.1495,5,6,21,0.0755,-2,-3,13,0.4374043,-4,-5,24,-1.797649,8,-8,2,19.5,-6,-7,12,0.5254259,-9,-10,39,4.55,11,12,0,0.8384444,-11,-12,32,0.4017544,-13,13,28,0.3016667,-14,-15],[-0.00049814,-0.0067321,0.0045053,-0.034093,-0.0001876,0.0036235,0.028353,0.00019111,-0.0039679,0.007544,-0.029135,0.017146,0.017578,-0.0029358,-0.047384]],[[18,0.4142857,1,5,12,0.7402762,2,4,44,0.2916667,3,-3,24,-1.65583,-1,-2,0,0.9442222,-4,-5,24,-1.374317,6,10,30,14.55,7,-10,26,0.6555,8,-9,26,0.6105,9,-8,15,-3.098296,-6,-7,10,0.1852152,11,-15,13,0.2650788,12,-14,39,3.1,13,-13,50,0.4642857,-11,-12],[-0.052197,0.022633,0.039679,0.00030784,0.040742,0.00049893,-0.0044404,0.026803,-0.050883,-0.035692,0.021335,-0.015098,0.0085565,-0.00063931,-0.0044264]],[[18,0.4142857,1,4,12,0.7402762,2,-4,44,0.6333333,3,-3,24,-1.65583,-1,-2,21,0.0375,5,12,21,0.0315,6,11,0,0.509,7,10,0,0.213,8,9,21,0.0275,-5,-6,47,0.775,-7,-8,32,0.8804762,-9,-10,31,0.9444444,-11,-12,20,-3.342644,13,-15,10,0.08505319,-13,-14],[-0.042631,0.023104,0.038583,0.0023944,-0.010503,0.033395,0.014009,-0.02538,-0.0032786,-0.024417,-0.031137,-0.0029244,-0.012555,0.023285,-3.764e-06]],[[20,-4.674669,-1,1,18,0.4142857,2,4,12,0.7402762,-2,3,0,0.951,-3,-4,25,-3.12918,-5,5,20,-0.5521725,6,13,21,0.4295,7,11,21,0.3455,8,-10,21,0.2985,9,10,21,0.276,-6,-7,5,9.5,-8,-9,39,6.9,-11,12,12,0.5859591,-12,-13,13,0.4629697,-14,-15],[-0.033357,0.024242,-0.00023194,0.039473,0.0076212,-0.00071985,0.01091,-0.0097028,-0.069224,0.0083573,-0.011807,-0.012652,0.0058023,0.014262,-0.010929]],[[42,4.775,1,10,28,0.1808333,2,3,15,-6.863352,-1,-2,47,0.2678571,4,8,26,0.2721667,5,6,7,11.5,-3,-4,11,1.027136,-5,7,10,0.01002513,-6,-7,6,7.5,-8,9,10,0.05013966,-9,-10,26,0.2251667,11,-15,26,0.2191667,12,-14,46,0.9166667,13,-13,10,0.07008772,-11,-12],[-0.018905,-0.0008542,-0.0016628,-0.04609,0.012527,-0.062218,0.003444,0.0023464,0.032293,0.0087992,-0.0086597,0.0047106,0.011521,-0.041728,0.0070055]],[[16,0.3666667,1,11,7,2.5,-1,2,6,64.5,3,-11,48,0.6333333,4,-10,3,3.5,5,-9,6,34.5,6,8,20,-0.4353855,7,-4,19,0.7321429,-2,-3,5,3.5,-5,9,30,29.65,10,-8,22,0.9148551,-6,-7,20,-0.5521725,-12,12,13,0.4500835,-13,13,6,11.5,-14,-15],[0.028402,-0.045587,0.014882,0.018424,-0.03804,0.0505,-0.03314,-0.034722,-0.049829,0.020636,0.018817,-4.9503e-05,0.017516,-0.027627,0.0090125]],[[18,0.4142857,1,2,12,0.7402762,-1,-2,33,206.6667,-3,3,34,57.25,4,-15,4,1555.5,5,9,20,-1.828697,6,8,26,0.173125,-4,7,26,0.1751,-5,-6,28,0.1091667,-7,-8,2,17.5,10,13,4,3705.5,11,-12,2,9.5,-9,12,4,2452.0,-10,-11,4,6084.5,-13,-14],[0.022185,0.0027612,0.012948,0.0022717,-0.078078,-0.010185,0.00311,0.026023,-0.036927,-0.0024758,-0.037517,0.00060313,0.017186,-0.0234,0.00023265]],[[42,4.775,1,10,12,1.116145,2,-10,28,0.1808333,3,4,15,-6.745587,-1,-2,24,-1.514122,5,7,24,-1.564064,-3,6,31,0.9444444,-4,-5,13,0.2300991,8,-9,2,31.5,9,-8,5,9.5,-6,-7,33,8112.25,11,-15,37,2.291667,-11,12,4,4483.5,-12,13,34,286.0833,-13,-14],[-0.017349,-0.00066391,0.00089105,-0.049324,-0.0055004,0.020196,-0.0059308,-0.013675,0.0018197,-0.010923,-0.0024691,0.021833,-0.0082242,0.0065343,0.014351]],[[18,0.4142857,1,-15,6,27.5,2,9,43,4.267857,3,8,5,1.5,-1,4,2,22.5,5,-6,21,0.0895,6,7,20,-2.127389,-2,-3,12,0.7324292,-4,-5,28,0.1091667,-7,-8,29,0.7083333,-9,10,12,0.8380278,11,12,33,2665.125,-10,-11,36,6.366667,-12,13,19,0.5634921,-13,-14],[0.022594,-0.0075048,0.040321,0.014072,-0.061047,-0.037819,-0.027337,0.026448,0.046083,-0.022402,0.038641,0.014307,-0.062031,0.028979,-0.0001546]],[[18,0.4142857,1,-15,4,17911.53,2,13,9,1.939833,3,11,5,6.5,4,10,19,0.5916667,5,-7,20,-1.768544,6,-6,26,0.152125,-1,7,7,6.5,8,9,24,-1.670009,-2,-3,35,5.633333,-4,-5,20,-2.147399,-8,-9,4,4070.501,-10,12,26,0.135125,-11,-12,5,10.5,-13,-14],[0.0093335,-0.035169,0.021422,-0.0094024,-0.079524,0.033567,0.026177,0.0093235,-0.028611,-0.022558,-0.029181,0.037978,0.038853,-0.028231,-0.00017249]],[[18,0.4142857,-1,1,25,-2.795782,2,5,4,1646.5,3,-5,48,0.9,4,-4,32,0.4966667,-2,-3,15,-4.74265,6,11,25,-0.08307347,7,-11,31,0.3666667,8,-10,21,0.0755,9,-9,4,1461.0,10,-8,13,0.4500835,-6,-7,13,1e-35,-12,12,31,0.775,13,-15,6,9.5,-13,-14],[0.0089037,-0.025591,0.0051762,0.02923,0.0090365,-0.033486,0.011753,-0.0010614,0.0059229,-0.010405,0.01462,0.020107,0.00012005,-0.014257,0.0015016]],[[18,0.4142857,1,-15,24,-1.977875,2,4,24,-2.044173,3,-3,42,1.9,-1,-2,36,8.1,5,13,32,0.7673913,6,-12,32,0.7455649,7,-11,24,-1.826607,-4,8,44,0.5857143,9,10,20,-2.4513,-5,-6,30,4.708333,11,-10,21,0.1095,12,-9,21,0.0145,-7,-8,24,-1.448137,-13,-14],[-0.020227,0.037578,-0.065722,0.036231,-0.064219,0.0011677,-0.040575,0.021311,-0.067598,0.027124,-0.062388,0.037752,-0.057918,0.026038,-0.00016031]],[[18,0.4142857,1,-15,19,0.5634921,2,-14,20,-1.683837,3,12,33,2548.25,4,7,21,0.0305,-1,5,0,0.7268889,-2,6,4,6559.5,-3,-4,0,0.851,8,10,0,0.7731111,9,-7,33,3104.25,-5,-6,32,0.4729532,-8,11,28,0.2108333,-9,-10,32,0.5917508,13,-13,46,0.5357143,-11,-12],[0.013936,-0.043508,0.038233,-0.041993,0.030348,-0.010426,0.039989,0.042695,-0.068633,0.0081834,0.058593,-0.018201,-0.025518,0.019604,-0.00017276]],[[18,0.4142857,1,-15,0,0.7268889,2,7,0,0.6605556,3,6,14,13812.0,4,-4,0,0.619,5,-3,4,3388.5,-1,-2,32,0.6757353,-5,-6,21,0.0835,8,-14,4,17911.53,9,-13,0,0.9557778,10,-12,0,0.7605556,-7,11,38,1.291667,12,13,2,30.5,-8,-9,50,0.9166667,-10,-11],[-0.043348,0.010345,0.043675,-0.048234,-0.063291,0.014573,0.02172,-0.081616,-0.0070028,0.021046,-0.03369,0.037133,0.035511,0.037077,-0.00017783]],[[18,0.4142857,1,8,0,0.7268889,2,7,0,0.6605556,3,6,36,6.291667,4,-4,15,-6.992559,5,-3,26,0.118125,-1,-2,34,286.0833,-5,-6,43,6.816667,-7,-8,16,0.3666667,9,12,7,2.5,-9,10,0,0.8221111,11,-12,48,0.6333333,-10,-11,24,-0.5529546,-13,13,12,0.5513655,-14,-15],[0.016101,-0.047495,0.015818,-0.028621,-0.070576,0.0073774,0.021868,-0.016391,0.026004,-0.033769,0.023995,0.00060098,-0.00023676,-0.0073782,0.017145]],[[18,0.4142857,1,2,50,0.2916667,-1,-2,21,0.6695,3,12,26,0.6655,4,10,25,-2.795782,-3,5,15,-4.74265,6,-9,25,-0.06234877,7,-8,12,0.5859591,8,9,4,12043.97,-4,-5,4,1434.16,-6,-7,4,3513.5,11,-12,4,1489.5,-10,-11,4,1878.195,-13,13,3,1.5,-14,-15],[-0.052097,0.010065,0.0054623,0.013555,-0.019091,-0.019139,-0.0050978,0.014789,6.2646e-05,-0.019085,0.032139,-0.040671,-0.04752,0.021694,-0.039416]],[[27,0.9444444,1,-15,37,0.3666667,2,6,34,33.625,3,4,35,2.9,-1,-2,0,0.1663333,5,-5,15,-3.23054,-3,-4,38,2.583333,7,-14,12,0.9810697,8,-13,37,4.888889,9,13,37,3.55,10,-10,23,6.5,11,-9,34,96.16667,12,-8,34,80.16667,-6,-7,0,0.831,-11,-12],[-0.066546,0.013103,-0.035211,0.027456,0.0099829,-0.0065275,0.036474,-0.025394,0.014338,-0.028856,0.030095,-0.032184,-0.028229,-0.051017,0.00027649]],[[18,0.4142857,1,2,0,0.951,-1,-2,33,5413.5,3,7,32,0.8066239,-3,4,4,2411.5,-4,5,9,0.3325757,6,-7,32,0.8675439,-5,-6,5,7.5,-8,8,4,7473.597,9,10,21,0.0595,-9,-10,38,9.416667,11,12,19,0.4365079,-11,-12,11,1e-35,13,-15,32,0.8740079,-13,-14],[0.0062633,0.039172,-3.1217e-05,-0.029238,-0.0059296,-0.035791,-0.0013685,0.0080064,-0.0055512,-0.043119,-0.013016,0.0040958,-0.034758,0.0045769,0.019964]],[[13,0.003541388,1,5,25,-1.265233,2,3,9,1.191503,-1,-2,3,1.5,-3,4,19,0.3798077,-4,-5,11,-1.285069,6,11,49,1e-35,7,-11,43,2.291667,-6,8,16,0.7083333,-7,9,33,2410.25,-8,10,10,0.490098,-9,-10,16,0.2678571,12,-15,6,17.5,-12,13,6,65.5,-13,-14],[-0.031716,-0.001086,0.02078,-0.0096325,0.0113,-0.015972,-0.025683,0.014094,-0.023632,0.029216,0.017158,0.044699,-0.046788,0.0063071,6.4856e-05]],[[18,0.4142857,-1,1,24,-1.374317,2,4,30,14.55,3,-4,15,-3.098296,-2,-3,10,0.1852152,5,-15,6,14.5,6,13,12,0.652153,-5,7,40,0.2361111,8,11,50,0.4642857,-6,9,20,-0.7343244,-7,10,6,2.5,-8,-9,48,0.9,12,-12,14,3338.5,-10,-11,19,0.9375,-13,-14],[0.0078601,0.00061803,-0.0040952,-0.034626,-0.0042781,0.02255,-0.022776,-0.026914,0.027156,0.011907,-0.0031203,-0.037316,0.0056623,0.021508,-0.0046695]],[[21,1e-35,1,-15,4,14196.0,2,-14,26,0.141125,3,13,30,1.708333,4,12,34,475.5,5,-9,1,340.0,6,10,4,1368.77,-1,7,4,1702.575,8,9,34,93.75,-2,-3,10,0.1051316,-4,-5,29,0.9444444,-6,11,6,9.5,-7,-8,32,0.4122316,-10,-11,45,0.225,-12,-13],[-0.026584,0.074863,-0.022524,-0.012964,0.022097,-0.016964,0.044211,-0.014184,0.020649,0.029776,-0.004365,-0.040328,-0.0025236,-0.029128,0.00026928]],[[34,67.16667,1,10,4,1288.5,2,3,15,-2.042366,-1,-2,2,15.5,4,9,23,2.5,5,8,5,7.5,-3,6,26,0.6535,-4,7,4,2805.803,-5,-6,4,2432.811,-7,-8,4,7848.2,-9,-10,32,0.2236111,-11,11,4,1288.5,12,-15,23,5.5,-12,13,9,2.817411,-13,-14],[0.0012725,0.021042,-0.02933,-0.00019928,-0.068293,0.012869,0.0077734,-0.031083,0.0057886,-0.026318,0.013552,-0.039388,-0.0054144,0.025386,0.00043537]],[[33,3195.417,1,2,32,0.826505,-1,-2,19,0.6904762,3,9,6,18.5,4,5,26,0.4315,-3,-4,31,0.6333333,-5,6,35,5.708333,-6,7,21,0.0115,8,-9,0,0.6836667,-7,-8,6,22.5,10,-15,2,19.5,-10,11,20,-0.9126785,12,13,20,-3.171346,-11,-12,38,9.416667,-13,-14],[-0.00039293,-0.011146,0.0036083,-0.030672,-0.021886,0.030826,0.011534,-0.053375,-0.0020963,0.013927,-0.04821,0.0063805,-0.047878,0.0031846,0.025474]],[[28,0.1235417,1,7,16,0.9,2,-7,24,-2.384105,-1,3,15,-4.052356,-2,4,4,1923.678,-3,5,4,3705.5,6,-6,30,14.70833,-4,-5,15,-3.098296,8,9,25,-0.1339366,-8,-9,9,1.228673,10,11,4,1239.5,-10,-11,14,324.5,-12,12,12,0.984056,13,-15,15,-2.577623,-13,-14],[0.046977,-0.012878,0.026123,-0.038572,0.027713,0.0012272,-0.00010005,0.00062311,0.0082251,0.017947,-0.0002816,0.013732,-0.0098697,-0.036728,0.0033418]],[[16,0.3666667,1,11,0,0.951,2,8,48,0.6333333,3,6,6,64.5,4,-4,4,8376.13,5,-3,4,7283.592,-1,-2,0,0.619,-5,7,20,-0.7586217,-6,-7,19,0.5916667,-8,9,6,84.5,-9,10,20,-0.4353855,-10,-11,24,-0.5529546,12,-15,19,0.4365079,-12,13,6,3.5,-13,-14],[-0.024905,0.050558,-0.034765,0.033419,-0.017207,0.060581,-0.032677,0.04578,-0.031991,0.04582,-0.031533,-0.00091649,-0.0062436,0.0038743,0.010274]],[[21,0.6715,1,13,21,0.6605,2,7,21,0.6555,3,6,28,0.1235417,-1,4,19,0.5227273,5,-4,5,4.5,-2,-3,4,861.5,-5,-6,4,1288.5,-7,8,16,0.9,-8,9,21,0.6685,10,11,4,1930.5,-9,-10,4,1833.28,12,-13,4,1307.5,-11,-12,4,1878.195,-14,-15],[-0.00068209,0.0034699,-0.0026844,0.0072501,0.025326,-0.05039,-0.049953,-0.025741,0.054599,0.018408,0.047241,-0.05104,0.024875,-0.058598,0.0050979]],[[42,4.775,1,7,12,1.116145,2,-7,28,0.1808333,3,5,25,-1.411807,4,-3,40,0.9375,-1,-2,24,-1.514122,-4,6,13,0.2650788,-5,-6,33,8112.25,8,-15,46,0.7083333,9,-14,10,0.07008772,10,-13,21,0.2375,-8,11,4,4790.73,12,13,13,0.1447568,-9,-10,24,-0.901209,-11,-12],[-0.0010153,0.0057445,-0.0020064,-0.00017261,0.014235,0.00068245,-0.010363,-0.0099509,0.024256,-0.0044224,0.0013961,-0.027357,0.0063864,0.010309,0.01382]],[[42,4.775,1,-15,12,1.116145,2,-14,28,0.189,3,7,15,-6.745587,-1,4,44,0.7321429,-2,5,31,0.9444444,6,-5,26,0.6015,-3,-4,12,0.7364633,8,10,0,0.5057778,-6,9,32,0.1214035,-7,-8,24,-1.301871,11,-13,5,8.5,-9,12,4,6009.412,-10,13,10,0.8100279,-11,-12],[-0.016688,9.9702e-05,-0.014494,0.026425,-0.0013447,-0.0082766,0.02251,0.0006978,0.0058439,0.0036695,-0.029902,0.03247,0.01828,-0.010259,0.0029263]],[[13,1e-35,1,5,15,-3.071241,2,-5,43,0.7916667,3,4,14,1426.5,-1,-2,8,2.811644,-3,-4,11,-1.285069,6,13,39,9.1,7,11,21,0.3665,8,-10,36,8.45,9,-9,22,0.6099034,-6,10,10,0.08505319,-7,-8,10,0.06012048,12,-13,20,-1.598352,-11,-12,18,0.4142857,-14,-15],[-0.012557,0.029371,-0.037674,0.0024431,0.036166,-0.0091697,0.016488,-0.0021562,-0.034667,-0.033205,-0.031586,-0.0043896,0.0051002,0.0082125,-3.902e-05]],[[13,0.003541388,1,4,25,-1.179611,-1,2,11,-0.4988081,3,-4,39,1.291667,-2,-3,36,7.55,-5,5,4,2658.5,6,7,21,0.1005,-6,-7,0,0.243,8,12,21,0.2615,9,-12,21,0.1985,10,-11,26,0.150125,11,-10,4,2910.286,-8,-9,12,0.9332304,-13,13,4,4234.5,-14,-15],[-0.0094089,0.024902,0.0038329,0.029508,-0.00083185,-0.0037202,-0.035244,-0.044196,0.01932,-0.07076,0.035608,-0.048816,0.0040369,-0.0193,-0.00078882]],[[33,3195.417,1,5,35,8.775,-1,2,14,1278.5,-2,3,21,0.0925,-3,4,12,0.7485033,-4,-5,5,7.5,6,12,0,0.4826667,-6,7,21,0.3635,8,-12,37,7.833333,9,10,37,6.416667,-7,-8,21,0.0525,-9,11,12,0.5908122,-10,-11,12,0.7562899,13,-15,38,0.775,-13,-14],[-0.00035453,0.02107,-0.0037661,-0.0074273,-0.048212,0.010623,0.0015337,-0.053144,0.048169,0.030363,0.0019036,-0.025975,-0.010007,0.0062621,-0.0072192]],[[33,3195.417,1,4,4,10756.5,-1,2,20,-0.7138818,3,-4,6,14.5,-2,-3,19,0.6904762,5,13,6,18.5,-5,6,31,0.6333333,-6,7,35,5.708333,-7,8,24,-1.052812,9,12,20,-2.171185,10,-11,36,6.708333,-8,11,34,707.75,-9,-10,4,23538.74,-12,-13,6,22.5,-14,-15],[-0.00016049,-0.021966,0.00038769,-0.047277,0.0030784,-0.021121,0.02774,0.030628,-0.028944,0.043279,-0.010177,0.011753,-0.015606,0.00097915,0.024742]],[[25,-2.795782,1,4,24,-1.016566,2,-4,4,1646.5,3,-3,37,1.916667,-1,-2,19,0.3484848,5,13,6,4.5,6,12,37,1.291667,7,11,4,1874.5,-5,8,20,-2.548917,-6,9,2,13.5,10,-9,24,-1.490401,-7,-8,4,1555.5,-10,-11,2,15.5,-12,-13,6,3.5,-14,-15],[0.0166,-0.025353,0.011377,-0.007607,0.0050074,5.3671e-05,-0.029223,-0.0029393,-0.0024544,-0.023415,0.0077438,-0.016987,-0.0032249,-0.0062736,0.0031245]],[[33,3236.167,1,10,4,10756.5,2,8,35,8.9,3,6,38,5.875,4,5,24,-0.5529546,-1,-2,13,0.4993094,-3,-4,4,2078.045,-5,7,6,1.5,-6,-7,24,-0.6161311,9,-10,6,14.5,-8,-9,4,4790.73,11,12,35,7.875,-11,-12,37,4.125,-13,13,11,-0.3491638,-14,-15],[-0.00032699,0.011526,-0.0097729,0.026033,0.013138,-0.033616,-0.0056045,-0.022707,-0.0013295,-0.045446,0.013498,-0.029254,0.00072293,-0.0062376,0.011588]],[[33,3195.417,1,3,4,17265.39,-1,2,7,3.5,-2,-3,5,7.5,4,6,20,-3.440047,5,-6,6,12.5,-4,-5,4,7283.592,7,9,32,0.8740079,-7,8,13,0.191696,-8,-9,13,0.1974477,-10,10,49,0.5833333,11,12,24,-1.826607,-11,-12,19,0.19375,13,-15,24,-3.020622,-13,-14],[-0.0004303,-0.041368,-0.00056503,0.03399,-0.011032,0.0035213,-0.0018632,-0.016675,-0.046767,-0.005419,0.017534,0.0032406,-0.0057914,-0.052222,0.013054]],[[21,0.1385,1,12,21,0.1335,2,10,19,0.4365079,3,5,6,5.5,-1,4,20,-1.564991,-2,-3,6,4.5,6,9,2,13.5,-4,7,35,8.55,8,-7,24,-1.826607,-5,-6,10,0.1900413,-8,-9,33,1808.167,-10,11,5,3.5,-11,-12,21,0.1985,13,-15,2,2.5,-13,-14],[0.0014977,-0.0086109,0.0055144,3.7235e-05,0.00093784,-0.037671,0.020731,0.011509,0.0019388,0.035101,0.018437,-0.028892,-0.048154,-0.005914,0.00052633]],[[33,5642.25,1,11,32,0.8066239,-1,2,12,1.008023,3,-11,39,8.8375,4,8,11,0.3628258,5,-6,2,13.5,6,-5,22,0.9607692,7,-4,0,0.181,-2,-3,2,7.5,9,10,38,1.875,-7,-8,33,4004.75,-9,-10,5,7.5,-12,12,12,0.8089278,13,-15,38,5.583333,-13,-14],[0.00013369,-2.3316e-05,-0.041798,0.051186,-0.0073947,0.0021493,0.029846,-0.022166,-0.0067344,0.0083433,-0.022257,0.007553,-0.0093225,0.011334,-0.010683]],[[21,0.6715,1,13,24,-0.5529546,2,11,21,0.1395,3,8,37,7.833333,4,-6,19,0.4365079,5,7,6,5.5,6,-3,26,0.105125,-1,-2,6,4.5,-4,-5,26,0.152125,9,-10,22,0.6978261,-7,10,4,1461.0,-8,-9,4,11196.95,-11,12,22,0.8297101,-12,-13,4,1878.195,-14,-15],[-0.001541,0.0088386,-0.0064082,-0.0059266,0.0071354,0.022019,-0.0064149,0.020965,-0.06306,-0.00052715,0.014047,-0.049221,0.0072714,-0.057916,0.0040409]],[[26,0.6715,1,13,24,-0.5529546,2,11,25,-2.795782,-1,3,9,5.235563,4,-10,28,0.08708333,5,9,11,-0.5345833,-2,6,11,-0.4359922,7,-6,39,9.733333,-3,8,9,1.808727,-4,-5,19,0.5505051,-7,10,6,9.5,-8,-9,4,11196.95,-11,12,34,393.0833,-12,-13,4,1878.195,-14,-15],[0.0055021,-0.0066552,-0.0054873,0.0056152,0.026332,-0.0011241,-0.00034114,-0.00094751,0.011843,-0.024724,0.013661,-0.047834,0.0071229,-0.057398,0.0038543]],[[33,3151.167,1,3,4,17265.39,-1,2,7,2.5,-2,-3,5,7.5,4,8,0,0.4826667,5,7,49,0.875,-4,6,4,10447.77,-5,-6,21,0.3635,-7,-8,12,0.6302976,9,11,21,0.0865,-9,10,31,0.2916667,-10,-11,10,0.7801099,12,13,31,0.9444444,-12,-13,25,-0.1243706,-14,-15],[-0.00044194,-0.045327,-0.0065168,0.0062029,0.027314,-0.027827,0.0023958,-0.023521,-0.0064718,0.021141,0.0023897,-0.012764,-0.0006168,-0.0023924,0.049785]],[[23,9.5,1,4,4,6213.5,-1,2,38,4.583333,3,-4,5,6.5,-2,-3,4,4165.375,-5,5,5,7.5,6,9,0,0.513,7,-9,26,0.1381667,-6,8,24,-2.23383,-7,-8,4,10756.5,10,-15,2,27.5,11,-14,2,11.5,12,-13,26,0.02125,-10,13,5,8.5,-11,-12],[0.00043691,-0.01211,-0.0024459,0.0061282,-0.042508,0.020395,-0.039606,0.0070152,0.0033815,0.026317,0.011876,-0.071905,-0.0013174,-0.036211,0.0035077]],[[27,0.9444444,1,-15,37,0.3666667,2,5,34,33.625,3,4,23,2.5,-1,-2,9,3.340748,-3,-4,5,7.5,6,13,32,0.6093478,7,12,20,-1.683837,8,-10,19,0.1742424,9,11,20,-3.45893,10,-7,33,1369.167,-5,-6,19,0.7321429,-8,-9,23,8.5,-11,-12,5,9.5,-13,-14],[-0.065451,0.01058,0.01079,-0.012333,-0.026424,0.02337,0.066428,-0.024386,0.019269,0.021444,-0.040153,-0.0049525,-0.061467,-0.011831,0.00025956]],[[13,0.003541388,1,5,25,-1.179611,-1,2,3,1.5,3,4,12,1.000001,-2,-3,19,0.3798077,-4,-5,36,7.55,-6,6,4,2658.5,7,9,0,0.925,8,-9,34,170.1667,-7,-8,0,0.243,-10,10,12,0.9332304,11,12,37,1.083333,-11,-12,4,4234.5,13,-15,34,183.1667,-13,-14],[-0.0088938,0.028161,-0.008991,-0.00857,0.010365,-0.00080331,-0.0042502,-0.034426,0.053515,0.016048,-0.00086369,0.0065376,0.0017375,-0.035976,-0.00049028]],[[23,9.5,1,10,4,6213.5,-1,2,34,282.75,3,-10,32,0.4553429,4,8,6,18.5,5,-6,50,0.9166667,6,7,16,0.7083333,-2,-3,0,0.8057778,-4,-5,2,23.5,9,-9,32,0.8523965,-7,-8,4,4277.68,-11,11,20,-3.427021,-12,12,42,5.527778,13,-15,26,0.1381667,-13,-14],[0.00040307,0.0076352,-0.029376,0.0090738,-0.027176,0.014034,-0.022537,0.025148,-0.0077019,0.0027285,-0.038192,0.022703,0.0064402,-0.00070738,0.01533]],[[21,0.4295,1,11,21,0.3455,2,7,21,0.2985,3,6,21,0.276,4,-4,21,0.2705,-1,5,35,8.55,-2,-3,5,10.5,-5,-6,4,2411.5,8,-11,5,5.5,9,10,4,2088.5,-7,-8,4,1288.5,-9,-10,33,1501.167,12,13,4,1307.5,-12,-13,4,4965.5,-14,-15],[0.00033149,-0.052031,0.01849,0.010292,-0.0075043,-0.063544,-0.047148,0.020772,-0.0085618,0.039643,0.0031124,0.0032339,-0.015902,0.007906,-0.010767]],[[25,-2.795782,-1,1,28,0.079,2,8,11,-0.5345833,3,4,37,3.633333,-2,-3,13,0.04540883,5,6,39,9.733333,-4,-5,37,5.833333,-6,7,21,0.3635,-7,-8,19,0.5505051,9,-15,24,-1.035583,10,11,21,0.5905,-9,-10,13,0.2003141,12,-14,18,0.7083333,-11,13,14,3846.5,-12,-13],[0.0051156,-0.00297,-0.023412,-0.0028043,0.018558,-0.0018623,0.0097964,-0.030625,-0.0017322,0.014175,0.034628,0.022906,-0.0055147,0.0011014,0.0058867]],[[33,206.6667,-1,1,34,55.25,2,4,33,1104.25,3,-4,21,0.6555,-2,-3,34,92.625,-5,5,21,0.5205,6,-15,21,0.5105,7,-14,26,0.4555,8,13,35,2.633333,9,10,21,0.3265,-6,-7,34,164.5,11,12,21,0.4355,-8,-9,21,0.4345,-10,-11,12,0.6746639,-12,-13],[0.011305,-0.0011908,-0.038163,-0.020086,0.003709,0.013569,-0.046199,-0.0027039,-0.051727,0.00091171,0.027571,0.014205,-0.050087,0.022706,-0.016718]],[[13,1e-35,1,6,15,-3.071241,2,-6,43,1.225,3,5,14,1426.5,-1,4,10,0.5700467,-2,-3,14,2473.5,-4,-5,20,-4.674669,-7,7,36,7.55,-8,8,4,2658.5,-9,9,6,18.5,-10,10,24,-1.143749,11,13,19,0.5634921,-11,12,20,-1.577195,-12,-13,10,0.1350676,-14,-15],[-0.0070575,0.02838,-0.01972,-0.043886,0.0025337,0.035448,-0.030615,-0.00060296,-0.018679,0.0047249,-0.0154,0.022726,-0.015574,0.013043,-0.009078]],[[21,0.6695,1,12,26,0.6655,2,-12,21,0.4295,3,11,21,0.3455,4,-9,21,0.2985,5,8,21,0.276,6,-4,21,0.2695,-1,7,31,0.2916667,-2,-3,5,10.5,9,-8,5,3.5,10,-7,26,0.2995833,-5,-6,39,4.472222,-10,-11,12,0.9751835,13,-15,39,6.9,-13,-14],[0.00041504,-0.050781,-0.018978,0.0098434,0.017378,-0.059973,-0.0036498,-0.060392,0.007537,-0.011261,-3.7092e-05,0.020237,-0.020979,0.019196,-0.053184]],[[33,206.6667,-1,1,36,7.55,-2,2,4,2658.5,3,5,21,0.1005,4,-5,24,-2.865795,-3,-4,0,0.3268889,-6,6,24,-2.577058,-7,7,30,1.583333,8,-15,7,3.5,-8,9,22,0.8834842,-9,10,0,0.4394444,-10,11,22,0.8973684,-11,12,20,-2.222537,-12,13,6,15.5,-13,-14],[0.011273,-0.00066927,-0.032752,0.010267,-0.033703,0.010594,-0.0067971,0.0088831,0.012226,0.019397,-0.081493,-0.076645,0.0037099,-0.044431,-0.00072268]],[[27,0.9444444,1,-15,37,0.3666667,2,5,34,33.625,3,4,35,2.9,-1,-2,6,1e-35,-3,-4,5,7.5,6,13,32,0.6093478,7,12,34,124.75,8,10,22,0.2679487,9,-7,24,-2.210132,-5,-6,12,0.9231563,-8,11,42,2.828571,-9,-10,35,8.366667,-11,-12,5,9.5,-13,-14],[-0.064239,0.01097,-0.011494,0.010318,-0.019318,0.038764,-0.012981,0.034356,-0.040038,0.02918,-0.031662,0.0042136,-0.060245,-0.011345,0.00024891]],[[18,0.4142857,1,-15,37,2.633333,2,-14,24,-1.385835,3,13,7,5.5,4,9,24,-1.616121,5,-6,21,0.0275,6,7,21,0.0175,-1,-2,43,1.9,8,-5,2,23.5,-3,-4,24,-1.448137,10,-11,24,-1.700106,11,12,41,0.3095238,-7,-8,29,0.7083333,-9,-10,50,0.775,-12,-13],[-0.008957,0.044683,-0.014454,0.041305,-0.054727,0.029457,0.018181,-0.059333,0.028799,-0.0098535,-0.073689,0.057786,-0.023257,0.017226,-0.0001373]],[[13,1e-35,1,6,15,-3.071241,2,-6,43,1.225,3,5,26,0.182125,-1,4,37,0.9444444,-2,-3,0,0.471,-4,-5,36,7.55,-7,7,12,0.8126261,8,11,37,1.083333,-8,9,21,0.2695,-9,10,21,0.276,-10,-11,37,3.267857,12,13,5,7.5,-12,-13,43,5.225,-14,-15],[0.021901,-0.034908,0.016404,-0.027156,0.020487,0.034873,-0.00064715,-0.0019637,0.012646,-0.029724,0.0073093,0.0067437,-0.0070248,-0.021665,1.411e-05]],[[18,0.4142857,-1,1,24,-0.5529546,2,11,25,-1.572033,3,8,24,-0.9342811,4,7,4,1207.5,5,-5,34,101.25,-2,6,23,4.5,-3,-4,19,0.4833333,-6,-7,9,4.083376,9,-11,28,0.07708333,-8,10,34,26.0,-9,-10,4,11196.95,12,13,21,0.6105,-12,-13,23,7.5,-14,-15],[0.0081337,0.00024959,-0.043798,0.0097261,0.0043597,0.0079236,-0.016715,-0.0025444,0.022546,0.00032282,-0.01652,0.016766,-0.0067971,-0.045464,0.0066791]],[[18,0.4142857,1,-15,0,0.7268889,2,8,0,0.6605556,3,7,4,14997.0,4,6,8,6.376407,-1,5,34,373.1667,-2,-3,37,3.267857,-4,-5,34,286.0833,-6,-7,21,0.0835,9,-14,4,17911.53,10,-13,0,0.9557778,11,-12,0,0.7605556,-8,12,38,1.291667,13,-11,26,0.152125,-9,-10],[0.012683,-0.04552,0.025285,-0.070664,0.018984,-0.068259,0.0047685,0.019299,-0.010983,-0.083343,0.0020827,0.03362,0.029544,0.034023,-0.00014347]],[[18,0.4142857,1,7,0,0.7268889,2,-7,2,28.5,3,6,4,3128.25,-1,4,28,0.2255,5,-4,37,0.2916667,-2,-3,5,3.5,-5,-6,36,7.55,-8,8,4,2658.5,9,10,35,6.9,-9,-10,6,17.5,11,12,5,7.5,-11,-12,31,0.775,-13,13,10,0.1401754,-14,-15],[-0.038515,-0.02557,0.013598,-0.023231,0.017425,-0.073999,0.015795,-0.00070688,-0.039754,-0.0073369,0.0068465,-0.0014253,-0.024036,0.0064749,-0.0093385]],[[18,0.4142857,1,-15,13,0.2300991,2,13,21,0.0185,3,5,23,8.5,-1,4,26,0.2211667,-2,-3,32,0.241423,-4,6,24,-1.576026,7,10,21,0.1325,8,-8,24,-1.65583,9,-7,32,0.3066239,-5,-6,32,0.5794737,11,12,24,-1.552703,-9,-10,19,0.4833333,-11,-12,6,8.5,-13,-14],[0.011413,-0.063855,0.029402,-0.027912,-0.049035,0.018289,0.045211,-0.029502,-0.033357,0.025833,-0.072537,0.0084351,-0.032984,0.022877,-0.00014739]],[[18,0.4142857,1,8,21,0.1565,2,-8,15,-4.74265,3,5,36,8.1,4,-3,32,0.6963109,-1,-2,50,0.9166667,-4,6,7,5.5,-5,7,5,2.5,-6,-7,15,-6.745587,9,-15,21,0.0425,-9,10,21,0.0905,-10,11,25,-0.07325552,12,-14,37,1.083333,13,-13,21,0.1215,-11,-12],[0.0023024,0.025588,-0.039153,0.033792,0.027657,0.012937,-0.060217,-0.041854,-0.025084,0.013739,-0.0368,0.01062,-0.038322,0.014535,-4.8641e-05]],[[16,0.4642857,1,8,48,0.5777778,2,7,0,0.949,-1,3,19,0.9375,4,-6,19,0.5634921,5,6,0,0.9731111,-2,-3,6,99.5,-4,-5,20,-0.7796492,-7,-8,24,-0.5529546,9,12,21,0.2685,-9,10,21,0.276,11,-12,2,7.5,-10,-11,13,0.4500835,-13,13,6,11.5,-14,-15],[-0.018281,0.056048,-0.010016,-0.050132,0.01459,0.041931,0.04542,-0.018351,0.0005865,-0.071821,-0.019673,0.00029341,0.015116,-0.026472,0.010231]],[[18,0.4142857,-1,1,14,208.0,-2,2,36,7.55,-3,3,4,2658.5,4,7,21,0.1005,5,-7,24,-2.865795,-4,6,37,1.916667,-5,-6,0,0.3268889,8,-15,37,3.45,9,12,32,0.6160256,10,11,21,0.0675,-8,-9,21,0.2975,-10,-11,4,4118.09,-12,13,4,6084.5,-13,-14],[0.0076654,0.011416,-0.00082519,-0.031874,0.021506,-0.029676,-0.031544,0.043883,-0.047846,0.016886,-0.03012,-0.049302,0.037285,-0.030782,0.0011587]],[[25,-2.795782,1,5,4,1646.5,2,4,37,1.916667,3,-3,34,87.58333,-1,-2,20,-0.7343244,-4,-5,9,5.235563,6,-15,28,0.079,-6,7,34,26.0,8,9,4,2465.5,-7,-8,19,0.5227273,-9,10,6,14.5,11,12,2,18.5,-10,-11,19,0.9375,13,-14,20,-0.9688522,-12,-13],[-0.0030778,0.036445,-0.023436,0.009529,-0.018047,-0.0011147,0.037197,-0.016846,-0.00050943,0.0063289,-0.0148,0.0093394,-0.019702,0.024181,-0.023286]],[[18,0.4142857,1,-15,7,23.5,2,-14,0,0.7268889,3,11,46,0.3666667,4,10,20,-1.69949,5,-7,46,0.3095238,6,9,38,2.708333,7,-4,22,0.7752525,8,-3,26,0.1381667,-1,-2,22,0.902381,-5,-6,32,0.4380482,-8,-9,32,0.8639169,12,-13,43,6.816667,-10,13,9,2.031432,-11,-12],[0.0081822,-0.043367,0.016403,-0.056158,0.029092,-0.028966,0.037532,0.012636,-0.050596,0.021791,-0.03916,0.029388,-0.039464,-0.045222,-0.00014147]],[[33,8993.5,1,10,21,0.1395,2,4,42,0.4166667,-1,3,0,0.8836667,-2,-3,26,0.1898333,5,-10,4,1077.0,6,9,26,0.173125,7,8,5,1.5,-4,-5,26,0.1751,-6,-7,0,0.111,-8,-9,43,3.45,11,-15,21,0.1055,-11,12,22,0.8722826,13,-14,0,0.8384444,-12,-13],[0.027668,0.0014415,-0.0068153,-0.010115,0.028867,-0.063724,0.0099258,-0.037187,-0.0091694,5.0436e-05,-0.015305,-0.046729,0.015806,0.014865,0.031444]],[[18,0.4142857,-1,1,25,-2.795782,-2,2,15,-4.74265,3,-15,25,-0.06234877,4,12,31,0.3666667,5,8,4,1385.5,6,-6,32,0.1160256,-3,7,26,0.096125,-4,-5,37,1.633333,9,11,10,0.2204651,10,-9,24,-1.876648,-7,-8,50,0.5357143,-10,-11,26,0.133125,-12,13,10,0.3050974,-13,-14],[0.0072627,0.0048256,0.0056592,-0.03087,0.0088066,0.0025571,-0.01761,0.017358,-0.010218,-0.001088,-0.026023,-0.0034479,0.0055005,0.033229,0.0001329]],[[13,0.003541388,1,6,49,0.2916667,2,-6,25,-1.08536,3,4,9,1.112597,-1,-2,27,0.6333333,-3,5,2,4.5,-4,-5,25,-1.572033,7,8,24,-0.9342811,-7,-8,24,-1.090094,-9,9,10,0.1350676,10,-15,18,0.7638889,11,12,4,23538.74,-10,-11,26,0.6115,13,-14,4,4440.5,-12,-13],[-0.029551,-0.00080417,-0.022681,0.033203,0.0058528,0.022829,0.0030015,-0.0082214,-0.0016171,0.025795,-0.018258,0.0089511,-0.00064748,-0.012463,-0.0066881]],[[33,7563.5,1,11,49,0.875,2,5,32,0.9183333,-1,3,13,0.1596158,-2,4,6,27.5,-3,-4,21,0.2535,6,-11,5,9.5,7,10,2,31.5,8,-8,21,0.0115,-5,9,21,0.0155,-6,-7,2,10.5,-9,-10,13,0.4109347,12,-15,36,8.583333,-12,13,21,0.4285,-13,-14],[-0.0002808,-0.027934,0.008188,-0.026993,0.040036,-0.052007,0.011083,-0.020646,-0.075232,-0.00055383,-0.026404,-0.012515,0.01336,-0.014238,0.019741]],[[18,0.4142857,-1,1,36,7.55,-2,2,4,2658.5,3,6,0,0.925,4,-6,21,0.0685,5,-5,21,0.0625,-3,-4,0,0.243,7,-15,21,0.2615,8,13,21,0.1985,9,12,21,0.1495,10,-10,4,2910.286,-7,11,35,6.45,-8,-9,21,0.2065,-11,-12,20,-1.669277,-13,-14],[0.0070256,-0.00068759,-0.023494,0.046619,-0.027196,0.053224,-0.039742,0.037171,0.0014485,-0.049134,0.051977,0.012208,0.012718,-0.083334,0.0016395]],[[34,67.16667,1,6,21,0.6555,2,-6,32,0.3894444,-1,3,26,0.03125,4,-5,21,0.0225,-2,5,24,-1.480764,-3,-4,32,0.2236111,7,11,21,0.2535,8,10,9,2.068092,-7,9,0,0.299,-8,-9,32,0.2015625,-10,-11,9,2.773712,12,-15,24,-3.522774,-12,13,33,996.0556,-13,-14],[-0.0012491,-0.024129,0.084529,-0.013319,-0.050803,-0.036534,0.022791,-0.01154,0.018811,-0.028418,0.027631,0.019598,-0.0097601,-0.00042973,0.003272]],[[33,7563.5,1,5,12,1.116145,-1,2,32,0.3920807,-2,3,33,2107.167,-3,4,32,0.7738636,-4,-5,12,0.5426697,-6,6,5,8.5,7,12,20,-2.829149,8,10,21,0.0255,9,-9,50,0.9166667,-7,-8,37,7.833333,11,-12,44,0.2916667,-10,-11,28,0.071,13,-15,42,5.875,-13,-14],[-4.0186e-05,0.0095335,-0.02618,0.0072087,-0.01988,0.02162,-0.017932,0.063375,-0.027678,0.01578,-0.0041385,0.028373,-0.0052216,0.024874,-0.017023]],[[24,-0.5529546,1,13,16,0.55,2,-13,19,0.1742424,3,5,24,-2.384105,-1,4,21,0.2375,-2,-3,0,0.4778889,6,7,19,0.3693182,-4,-5,24,-1.461737,-6,8,7,1.5,9,11,24,-1.407079,-7,10,6,102.5,-8,-9,19,0.9375,12,-12,21,0.1495,-10,-11,13,0.4500835,-14,-15],[0.044091,-0.027739,0.013779,-0.046978,-0.014021,-0.032221,0.046501,-0.054485,0.030116,0.011602,-0.0065836,0.031318,0.00017706,0.012302,-0.009298]],[[33,7563.5,1,11,49,0.875,-1,2,21,0.2545,3,10,4,1833.28,-2,4,2,8.5,-3,5,0,0.347,-4,6,19,0.08957219,7,9,20,-3.096517,-5,8,4,6361.898,-6,-7,12,1.065741,-8,-9,30,0.7083333,-10,-11,12,0.5908122,-12,12,5,8.5,13,-15,50,0.9166667,-13,-14],[-0.00044458,0.032179,-0.06408,0.021695,0.010909,0.010287,-0.028602,0.014937,-0.030659,-0.05635,0.012137,0.018931,-0.01314,0.011767,-0.0081085]],[[33,7563.5,1,10,49,0.875,2,3,32,0.9183333,-1,-2,13,0.01897533,-3,4,20,-2.323763,5,7,20,-3.427021,-4,6,4,11861.5,-5,-6,21,0.2545,8,-10,4,1773.0,-7,9,4,6152.7,-8,-9,13,0.4109347,11,-15,36,8.583333,12,13,4,8572.11,-11,-12,26,0.05216667,-13,-14],[-0.00030325,-0.012323,0.023682,0.021258,-0.0064248,-0.042351,0.037112,-0.00905,0.015129,-0.027079,0.019379,-0.015545,0.033715,0.0042296,0.01828]],[[20,-4.674669,-1,1,14,208.0,-2,2,21,0.4295,3,11,21,0.3455,4,7,21,0.2985,-3,5,26,0.31125,6,-6,14,1549.5,-4,-5,4,2411.5,8,-11,37,2.928571,9,10,4,1288.5,-7,-8,4,2088.5,-9,-10,4,6624.5,12,-15,14,1796.5,13,-14,4,829.0,-12,-13],[-0.028775,0.010644,0.00025931,0.00028872,-0.04301,-0.0015184,-0.012564,0.037984,-0.046037,0.019326,0.0020914,0.014054,-0.009487,0.0058706,-0.014488]],[[28,0.1255,1,3,3,2.5,-1,2,10,0.1350676,-2,-3,19,0.3484848,4,13,26,0.2328333,5,9,21,0.1545,6,7,22,0.05409357,-4,-5,21,0.1625,8,-8,0,0.2394444,-6,-7,26,0.2431667,10,11,0,0.8173333,-9,-10,9,0.8223952,-11,12,15,-4.585711,-12,-13,21,0.6105,-14,-15],[-0.00020169,0.0066299,-0.013483,0.016895,-0.0033721,0.027014,-0.053145,-0.010034,0.037386,-0.031583,0.0065533,0.009821,-0.012167,0.0046563,-0.030343]],[[36,7.55,1,7,32,0.6012821,-1,2,4,1489.5,3,5,37,2.928571,4,-4,4,1288.5,-2,-3,21,0.4355,6,-7,21,0.2315,-5,-6,4,2658.5,8,9,21,0.1005,-8,-9,26,0.36125,10,12,32,0.6310069,11,-12,21,0.0675,-10,-11,12,0.5426697,13,-15,32,0.782971,-13,-14],[0.00046628,-0.0079669,0.044306,-0.033658,-0.0059586,0.0028078,-0.043797,-0.0010832,-0.029519,0.020525,-0.019798,0.0043098,-0.051548,0.015327,-0.014539]],[[33,7563.5,-1,1,12,0.5908122,2,4,19,0.09761905,3,-4,50,0.9166667,-2,-3,36,8.583333,5,12,4,8572.11,-5,6,2,15.5,7,8,12,0.7643399,-6,-7,2,24.5,-8,9,19,0.2792208,10,-12,20,-1.858795,11,-11,30,0.4166667,-9,-10,21,0.4285,13,-15,16,0.4642857,-13,-14],[-0.00018911,-0.021467,0.034655,0.0082437,0.01849,0.0016581,-0.070149,0.00045091,0.0093335,-0.04314,-0.072333,-0.0045534,-0.028433,0.012734,-0.012817]],[[33,7563.5,1,9,49,0.875,-1,2,13,0.01897533,3,4,5,7.5,-2,-3,24,-2.323985,5,7,24,-3.420611,-4,6,7,1.5,-5,-6,26,0.2532,8,-9,2,25.5,-7,-8,13,0.4993094,10,13,36,8.583333,-10,11,26,0.4295,12,-13,16,0.3666667,-11,-12,35,9.9,-14,-15],[-0.00042926,0.031552,-0.0029641,0.018576,-0.0055126,-0.034083,0.018592,-0.0073593,-0.019469,-0.0064485,-0.029473,0.013399,-0.013576,-0.011907,0.02849]],[[28,0.1255,1,3,3,2.5,-1,2,10,0.1350676,-2,-3,19,0.2928571,4,11,6,6.5,5,10,26,0.2001667,6,8,21,0.1545,-4,7,21,0.1565,-5,-6,2,20.5,-7,9,24,-1.780211,-8,-9,10,0.6100847,-10,-11,21,0.6105,12,-15,6,5.5,13,-14,34,137.1,-12,-13],[-0.00020228,0.005544,-0.01377,-0.0001048,-0.06044,-0.011612,0.003533,0.034431,-0.0093101,-0.012033,0.012452,0.0059069,-0.018245,0.0060154,-0.02877]],[[28,0.1255,1,7,3,2.5,-1,2,19,0.775,3,6,10,0.1150221,4,5,26,0.118125,-2,-3,20,-1.878601,-4,-5,6,17.5,-6,-7,9,3.238265,8,-15,15,-3.098296,-8,9,4,1368.77,10,11,9,0.3325757,-9,-10,34,72.75,12,-14,2,12.5,13,-13,4,3328.5,-11,-12],[-0.00021494,-0.045967,0.0052913,-0.0027154,-0.022043,-0.008558,0.035077,0.0041466,0.021422,-0.001495,-0.038274,0.012468,-0.00027867,-0.00089533,-0.01814]],[[18,0.4142857,1,13,15,-4.74265,2,-13,36,8.1,3,-12,38,4.125,4,12,5,1.5,-1,5,43,3.55,6,8,8,5.570607,-2,7,0,0.9673333,-3,-4,38,0.3666667,9,-9,7,2.5,10,-8,8,6.62316,11,-7,21,0.0165,-5,-6,5,10.5,-10,-11,15,-6.863352,-14,-15],[0.021487,0.0014375,-0.044782,0.01792,0.014731,-0.069556,0.029227,0.010223,0.036807,0.042167,-0.016269,-0.036717,0.020815,-0.0095316,-2.9796e-05]],[[18,0.4142857,-1,1,36,7.55,2,3,32,0.6012821,-2,-3,4,2658.5,4,5,35,6.9,-4,-5,6,17.5,6,12,9,2.773712,7,-12,5,8.5,8,10,26,0.3631667,-6,9,0,0.7894444,-7,-8,6,1.5,11,-11,12,0.9751835,-9,-10,10,0.1401754,13,-15,27,0.45,-13,-14],[0.0070982,0.00031577,-0.0030992,-0.036153,-0.0051388,0.0047298,-0.063835,0.013704,-0.073201,0.0068623,-0.0021544,0.012351,-0.055386,0.0038826,-0.012211]],[[28,0.089,1,3,11,-0.5345833,2,-3,37,3.633333,-1,-2,34,26.0,4,5,12,0.2883545,-4,-5,12,0.7364633,6,9,23,8.5,7,-9,12,0.2156542,-6,8,34,30.25,-7,-8,5,8.5,10,13,15,-1.458246,11,-13,50,0.5357143,12,-12,24,-1.385835,-10,-11,22,0.3582888,-14,-15],[-0.0019526,-0.021819,-7.4046e-05,-0.0055604,0.034973,0.0070204,-0.033492,-0.0055781,0.0041299,0.0038492,0.01662,-0.00056129,0.015573,0.012029,-0.0076124]],[[33,7563.5,1,7,20,-4.526531,-1,2,21,0.1385,-2,3,26,0.159125,4,-7,32,0.6963109,5,-6,26,0.1541667,6,-5,35,7.875,-3,-4,13,0.4993094,8,13,36,8.583333,9,11,5,9.5,10,-10,11,0.1394647,-8,-9,21,0.4285,12,-13,16,0.4642857,-11,-12,35,9.9,-14,-15],[-0.023461,0.00088852,0.00049983,-0.051466,-0.042949,-0.035425,-0.00030164,-0.021522,0.0035706,0.0058906,-0.025354,0.013215,-0.01247,-0.010561,0.027273]],[[21,0.6695,1,11,21,0.6605,2,8,21,0.6555,3,5,33,7563.5,-1,4,13,0.4109347,-2,-3,4,861.5,-4,6,20,-0.7586217,7,-7,4,2256.5,-5,-6,20,-1.253368,-8,9,4,3513.5,10,-11,4,1489.5,-9,-10,4,1878.195,12,13,0,0.143,-12,-13,3,1.5,-14,-15],[-0.00018402,0.00091263,0.016461,0.025583,-0.07034,0.0060299,0.016328,-0.048574,-0.013943,0.031434,-0.039622,-0.0068437,-0.063847,0.018937,-0.036499]],[[12,1.116145,1,10,16,0.2678571,2,5,6,17.5,-1,3,6,65.5,-2,4,12,0.6040239,-3,-4,20,-0.5521725,6,9,36,7.55,-5,7,4,2658.5,8,-8,35,6.9,-6,-7,12,0.5513655,-9,-10,39,4.55,11,12,0,0.8384444,-11,-12,35,3.225,-13,13,28,0.3116667,-14,-15],[0.040683,-0.043853,-0.032636,0.030004,-0.00053243,-0.039647,-0.0040387,0.0025935,-0.0064666,0.013832,-0.025706,0.018937,0.018737,-0.0028246,-0.048174]],[[18,0.4142857,1,11,7,19.5,2,-11,12,0.7402762,3,5,36,7.291667,-1,4,19,0.5916667,-2,-3,21,0.0185,6,8,23,8.5,-4,7,26,0.2211667,-5,-6,21,0.1325,-7,9,44,0.5857143,-8,10,25,-0.09116078,-9,-10,25,-3.12918,-12,12,9,5.557174,13,-15,42,4.775,-13,-14],[0.024993,-0.05914,0.032482,0.011574,-0.055362,0.02489,0.010916,-0.05775,-0.019275,0.03097,-0.034773,0.0060074,-0.0005629,0.0022789,-0.025571]],[[18,0.4142857,1,-15,9,1.939833,2,-14,46,0.775,3,13,37,2.633333,4,12,6,27.5,5,10,26,0.121,-1,6,20,-2.035795,7,8,8,6.682354,-2,-3,38,3.366667,9,-6,22,0.9511905,-4,-5,26,0.159125,11,-9,21,0.0315,-7,-8,19,0.1277174,-10,-11,20,-2.082449,-12,-13],[0.016925,-0.057996,0.021533,0.019252,-0.048898,-0.056254,0.0056705,-0.06146,0.026529,-0.033449,0.021381,0.021639,-0.070273,0.018281,-0.00012791]],[[16,0.4642857,1,5,48,0.5777778,2,3,0,0.951,-1,-2,34,62.75,-3,4,2,28.5,-4,-5,31,0.775,6,7,6,16.5,-6,-7,6,3.5,8,9,0,0.407,-8,-9,10,0.2204651,10,11,2,14.5,-10,-11,16,0.7083333,12,-15,7,4.5,-12,13,22,0.5477273,-13,-14],[-0.017495,0.012695,-0.020796,0.0015808,0.062559,1.2459e-05,-0.016561,-0.00093474,-0.013304,0.012102,0.0031757,-0.022058,0.020913,-0.0090687,0.0016457]],[[18,0.4142857,-1,1,36,7.55,-2,2,39,9.583333,3,13,5,3.5,4,7,13,0.2493618,5,-6,26,0.06325,6,-5,5,2.5,-3,-4,5,7.5,8,-13,49,0.5833333,9,12,21,0.2825,10,-10,26,0.1481667,11,-9,12,0.961179,-7,-8,2,22.5,-11,-12,24,-2.81442,-14,-15],[0.0068772,-0.00064453,-0.012114,0.027622,-0.032443,0.00053732,-0.00052422,-0.030534,0.0085242,-0.052401,0.028835,-0.0033773,-0.0043662,-0.01341,0.0053849]],[[34,67.16667,1,13,22,0.5779352,2,-13,5,7.5,3,11,21,0.2685,4,7,26,0.2541667,5,-4,26,0.173125,-1,6,26,0.1751,-2,-3,21,0.4375,8,9,2,8.5,-5,-6,21,0.5105,10,-9,12,0.5814905,-7,-8,21,0.6555,12,-12,20,-1.055824,-10,-11,32,0.2236111,-14,-15],[-0.00015214,-0.055571,-0.0096483,0.01571,-0.063855,-0.018531,-0.015501,0.020688,-0.043232,0.011294,-0.0046018,-0.034263,-0.041883,0.011614,-2.0404e-05]],[[34,164.5,1,9,4,7750.0,2,5,19,0.4365079,3,-4,24,-0.7957936,4,-3,30,3.1,-1,-2,30,8.366667,6,-9,15,-1.190579,7,-8,4,17911.53,8,-7,36,4.083333,-5,-6,4,1930.5,10,11,23,6.5,-10,-11,2,4.5,12,-15,26,0.4555,13,-14,24,-3.020622,-12,-13],[-0.00083358,-0.013725,0.016073,0.0027204,-0.0033811,-0.027004,-0.046926,-0.061679,0.0020599,-0.03836,0.018128,-0.016584,0.029331,-0.060005,0.0011443]],[[25,-3.12918,-1,1,28,0.079,-2,2,34,26.0,3,4,4,2465.5,-3,-4,19,0.5505051,5,10,24,-1.035583,-5,6,13,0.2003141,7,-10,14,3929.5,-6,8,18,0.7083333,-7,9,14,4709.5,-8,-9,20,-0.7796492,11,-15,29,0.9444444,12,13,12,0.7210112,-11,-12,25,-0.302818,-13,-14],[0.0060569,-0.0010674,0.034983,-0.015131,-0.0013197,0.025143,0.025805,-0.042765,0.00077808,2.4745e-05,-0.011619,0.0050419,0.00051579,0.014743,-0.010866]],[[16,0.4642857,1,12,19,0.9375,2,-12,19,0.5916667,3,-11,2,31.5,4,7,4,30185.47,5,6,4,17265.39,-1,-2,16,0.2111111,-3,-4,50,0.4642857,-5,8,32,0.5026316,9,10,30,40.83333,-6,-7,40,0.5857143,-8,11,20,-1.524328,-9,-10,24,-0.5529546,-13,13,12,0.5513655,-14,-15],[-0.011409,-0.045684,-0.029281,0.04978,0.046906,-0.059364,0.017108,-0.036555,-0.027684,0.033491,-0.031532,0.02365,-2.5805e-05,-0.0061957,0.014034]],[[26,0.6715,1,13,24,-0.5529546,2,11,25,-2.795782,-1,3,9,5.511334,4,-10,28,0.08708333,5,8,11,-0.5345833,6,-5,37,3.633333,7,-4,33,986.25,-2,-3,19,0.5505051,9,10,34,26.0,-6,-7,25,-1.098598,-8,-9,12,0.5513655,12,-13,43,3.55,-11,-12,12,0.9693974,-14,-15],[0.0047009,-0.019177,-0.00044734,-0.021101,-0.00044115,0.019458,-0.0005424,-0.027836,0.0061895,-0.027084,0.0021393,-0.026953,0.012105,-0.0018704,-0.05534]],[[33,8993.5,1,13,49,1e-35,-1,2,4,11382.03,3,12,21,0.2545,4,-11,20,-3.427021,-2,5,20,-2.127389,6,11,46,0.4642857,7,-8,4,7001.5,8,-7,21,0.2435,9,-6,0,0.341,-3,10,0,0.3615556,-4,-5,12,1.044826,-9,-10,20,-2.790534,-12,-13,36,8.583333,-14,-15],[-0.00043087,0.025973,0.03118,-0.053478,0.0058287,-0.027983,-0.0060867,-0.058329,0.015207,-0.016475,-0.034103,-0.03097,-0.0015258,-0.010542,0.014222]],[[13,0.003541388,1,-15,39,1.291667,2,3,33,1299.25,-1,-2,16,0.55,4,6,14,5510.5,5,-5,4,1077.0,-3,-4,24,-1.31372,7,13,43,0.3666667,8,12,10,0.7002538,9,-10,21,0.1355,10,-9,14,851.5,-6,11,28,0.07366667,-7,-8,28,0.21875,-11,-12,28,0.03366667,-13,-14],[-0.014676,0.029382,0.017897,-0.044083,0.0021101,-0.033939,0.033473,0.0053952,-0.013817,-0.042062,-0.0087072,0.018375,-0.0005528,0.029756,-0.00016713]],[[13,0.003541388,1,11,39,1.291667,2,3,26,0.31475,-1,-2,19,0.4365079,4,-11,2,10.5,5,8,42,1.291667,6,-6,21,0.0115,-3,7,40,0.2916667,-4,-5,23,6.5,9,10,34,107.75,-7,-8,10,0.2250828,-9,-10,37,1.083333,12,13,4,1773.0,-12,-13,4,1773.0,-14,-15],[0.024563,-0.029771,-0.032277,-0.013057,0.028184,-0.012542,-0.006758,-0.044331,0.0066235,-0.02513,0.010399,0.0045274,-0.0031435,-0.016976,0.0023529]],[[18,0.4142857,-1,1,9,2.863754,-2,2,5,8.5,3,11,14,3702.5,4,10,5,1.5,-3,5,2,20.5,6,8,23,7.5,7,-6,33,1709.25,-4,-5,6,13.5,9,-9,19,0.3038462,-7,-8,6,33.5,-10,-11,6,6.5,12,-15,0,0.299,-12,13,32,0.8082579,-13,-14],[0.0066734,-0.0005249,0.010429,-0.0083419,0.0052508,-0.01949,0.025929,-0.01077,-0.0047555,0.014132,-0.020685,0.0061484,0.033726,-0.00039039,0.00192]],[[28,0.079,1,5,25,-1.411807,2,-5,24,-0.9342811,3,-4,4,1207.5,4,-3,37,1.45,-1,-2,34,26.0,6,7,4,2465.5,-6,-7,26,0.08416667,8,13,21,0.0825,9,-13,4,6213.5,10,11,35,7.291667,-8,-9,2,18.5,-10,12,21,0.0555,-11,-12,26,0.0891,-14,-15],[0.00096149,-0.02912,0.0031885,-0.0068598,-0.0027341,0.03438,-0.01552,-0.0041771,-0.022394,0.014219,0.0052777,-0.020463,-0.049781,0.023276,0.001212]],[[13,0.003541388,1,-15,25,-0.9187054,2,5,14,1302.5,-1,3,2,10.5,-2,4,14,4914.5,-3,-4,39,1.291667,-5,6,24,-1.301871,7,13,29,0.7083333,8,10,32,0.3083916,9,-8,9,2.293563,-6,-7,50,0.6904762,11,12,22,0.6099034,-9,-10,0,0.9173333,-11,-12,10,0.2005025,-13,-14],[-0.027654,0.011058,-0.021602,0.0092172,0.0249,0.024314,-0.024978,0.00031881,-0.033514,0.011666,-0.039982,0.017131,0.022209,-0.014972,-0.00018076]],[[13,0.003541388,1,13,36,8.733333,2,-13,4,1307.5,3,4,22,0.1081871,-1,-2,39,1.125,-3,5,16,0.55,6,7,4,5428.16,-4,-5,24,-1.31372,8,12,4,1923.678,9,-10,36,5.464286,10,-9,9,0.9739683,-6,11,26,0.1778333,-7,-8,4,1923.678,-11,-12,36,7.55,-14,-15],[0.010684,-0.026236,0.027272,-0.035896,0.010466,-0.0017234,0.046355,-0.0026442,-0.034406,-0.00057331,-0.016052,0.027443,-0.019687,-0.0007316,0.0015415]],[[13,0.003541388,1,3,36,8.733333,2,-3,32,0.9555336,-1,-2,37,1.083333,4,11,40,0.775,-4,5,38,3.55,6,-11,23,5.5,7,10,13,0.2691837,8,-8,26,0.09416667,-5,9,14,1549.5,-6,-7,5,6.5,-9,-10,40,0.4142857,12,-15,13,0.3081569,13,-14,23,4.5,-12,-13],[0.0056454,0.031797,-0.01764,0.0010917,0.01609,0.0058081,-0.030018,-0.011278,-0.032622,-0.010049,0.0023413,-0.034364,-0.011437,0.0039636,0.0025091]],[[13,0.003541388,1,11,36,8.733333,2,-11,14,1302.5,3,4,32,0.1056619,-1,-2,41,0.8166667,5,-10,16,0.55,6,7,14,5510.5,-3,-4,24,-1.31372,8,10,32,0.3007937,9,-7,26,0.03225,-5,-6,14,1856.5,-8,-9,36,7.55,-12,12,4,2658.5,-13,13,6,18.5,-14,-15],[0.0091165,-0.027707,-0.036169,0.010677,0.048897,0.0073031,-0.0021587,-0.023016,0.025157,0.025831,-0.016945,-0.00068627,-0.012156,0.0038767,-0.0028874]],[[13,0.003541388,1,-15,16,0.55,2,4,0,0.565,3,-3,14,965.5,-1,-2,31,0.6333333,5,12,8,4.196632,6,-11,36,4.472222,7,11,1,340.0,-4,8,6,3.5,9,10,4,861.5,-5,-6,10,0.1301042,-7,-8,32,0.9555336,-9,-10,6,1e-35,-12,13,13,1e-35,-13,-14],[0.022614,-0.034839,0.0095975,0.033769,-0.030037,0.01468,-0.057532,0.027957,-0.01167,0.027205,-0.014136,-0.022324,0.035164,0.011261,-0.00017198]],[[21,0.1395,1,10,19,0.4365079,2,-10,21,0.1055,3,9,21,0.0935,4,8,4,1123.5,-1,5,21,0.0845,6,7,21,0.0835,-2,-3,26,0.08816667,-4,-5,20,-2.829149,-6,-7,24,-2.070556,-8,-9,26,0.152125,11,13,22,0.6978261,-11,12,4,1461.0,-12,-13,9,3.461327,-14,-15],[-0.016925,-0.00061721,-0.055602,0.039083,0.0043896,0.01062,-0.020235,0.012927,-0.0086717,0.0037404,-0.0063324,0.018082,-0.060451,-0.00080061,0.0081382]],[[34,67.16667,1,9,9,0.4426833,2,3,23,5.5,-1,-2,5,7.5,4,8,21,0.2685,5,7,26,0.260125,6,-5,26,0.173125,-3,-4,13,0.401979,-6,-7,21,0.6555,-8,-9,32,0.2236111,10,-15,21,0.2535,11,13,9,2.068092,-10,12,0,0.299,-11,-12,32,0.2015625,-13,-14],[0.0058554,-0.054441,-0.001811,-0.014552,0.01092,-0.0043417,-0.031114,0.0036413,-0.036321,0.01968,-0.011564,0.014919,-0.024684,0.025873,3.2382e-05]],[[21,1e-35,1,-15,37,0.6333333,2,6,5,5.5,3,4,22,0.1026316,-1,-2,31,0.9444444,5,-5,24,-1.876648,-3,-4,5,4.5,7,10,12,0.9063715,8,9,0,0.9442222,-6,-7,22,0.6602564,-8,-9,37,2.225,11,13,0,0.7336667,12,-12,24,-1.763591,-10,-11,36,3.225,-13,-14],[-0.052871,-0.0014427,0.0013142,-0.053958,0.01724,0.014006,-0.033325,0.00075913,-0.041238,-0.016937,0.012387,-0.033804,-0.0044459,-0.053525,0.00022242]],[[33,7563.5,-1,1,12,0.5426697,2,3,19,0.09761905,-2,-3,43,3.633333,4,12,34,930.0,5,9,21,0.0235,-4,6,42,5.118056,7,8,2,28.5,-5,-6,13,0.3361275,-7,-8,7,3.5,-9,10,12,0.8017258,-10,11,7,5.5,-11,-12,26,0.15625,-13,13,34,522.75,-14,-15],[-0.00018381,0.031972,0.0068068,0.024846,-0.0027611,-0.021411,-0.002138,0.032658,0.019716,0.016564,-0.048483,0.016069,0.033972,0.013817,-0.031175]],[[33,7563.5,-1,1,12,0.5426697,2,4,19,0.09761905,-2,3,6,42.5,-3,-4,32,0.9013889,5,10,19,0.422619,6,-10,7,1e-35,7,8,6,6.5,-5,-6,9,1.025386,9,-9,20,-1.071879,-7,-8,20,-2.829149,11,13,21,0.0255,12,-13,0,0.497,-11,-12,44,0.2916667,-14,-15],[-0.00018128,0.030599,-0.0046469,0.023963,0.02183,-0.022318,-0.046931,-0.00056958,-0.0043808,0.0054262,0.060919,-0.016941,-0.024962,0.015762,-0.0013375]],[[33,7563.5,-1,1,12,0.6040239,2,6,19,0.09761905,3,4,50,0.9166667,-2,-3,24,-1.130075,5,-6,38,4.9,-4,-5,36,8.583333,7,10,8,4.364144,8,-10,32,0.8740079,9,-9,19,0.9375,-7,-8,26,0.05216667,11,12,22,0.9534632,-11,-12,19,0.03452381,13,-15,6,15.5,-13,-14],[-0.00018064,-0.022773,0.02986,0.018718,-0.057785,0.014173,-0.04103,0.019579,-0.0042114,0.015076,0.037072,-0.016278,0.0025537,-0.048497,0.0090267]],[[13,0.003541388,1,8,41,0.3095238,2,-8,39,8.1,-1,3,12,1.000001,4,7,1,340.0,-2,5,15,-2.300514,6,-5,48,0.45,-3,-4,0,0.369,-6,-7,20,-4.603324,-9,9,9,2.863754,-10,10,38,0.775,11,13,25,-1.572033,-11,12,20,-1.213239,-12,-13,30,1.416667,-14,-15],[-0.014243,0.029283,-0.010524,0.022984,0.030344,-0.024932,0.0076464,0.010999,-0.027026,-0.00054478,0.0026489,-0.0084614,0.019899,0.016891,-0.004015]],[[18,0.4142857,1,4,15,-4.732402,2,-4,4,21755.98,3,-3,38,4.9,-1,-2,15,-6.863352,5,9,28,0.21875,6,-9,18,0.8819444,7,-8,38,2.416667,8,-7,24,-3.493024,-5,-6,13,0.004714675,-10,10,9,2.863754,-11,11,38,0.775,12,13,2,14.5,-12,-13,4,1833.28,-14,-15],[-0.001304,0.030928,0.026753,0.02024,0.02989,-0.030235,0.016912,0.007384,0.012109,0.0046956,-0.00064823,-0.0041792,0.004037,0.028952,0.0076121]],[[33,7563.5,-1,1,13,0.3624323,2,13,21,0.0245,3,4,0,0.497,-2,-3,36,8.45,5,6,4,8572.11,-4,-5,24,-2.838904,-6,7,21,0.1565,-7,8,24,-2.147404,9,11,0,0.9731111,10,-10,4,9016.41,-8,-9,7,5.5,12,-13,7,3.5,-11,-12,21,0.0225,-14,-15],[-0.00018089,0.0501,-0.0086866,0.016639,-0.016239,-0.028511,0.023826,0.0010258,-0.065604,0.028232,0.0060281,-0.021291,0.034649,-0.03623,0.015547]],[[33,7563.5,1,9,16,0.2111111,2,3,19,0.3923077,-1,-2,32,0.8066239,-3,4,4,2411.5,-4,5,0,0.529,-5,6,0,0.831,7,8,36,5.225,-6,-7,21,0.0605,-8,-9,13,0.4993094,10,13,22,0.902381,11,-13,42,5.708333,12,-12,21,0.1005,-10,-11,35,9.9,-14,-15],[0.027835,-0.047902,0.00026412,-0.024898,0.0026365,-0.02657,-0.0067542,-0.013626,0.008456,0.013393,-0.014696,0.012474,0.0067764,-0.012459,0.024186]],[[34,67.16667,1,11,22,0.56125,2,-11,5,7.5,3,10,26,0.5115,4,-8,21,0.2685,5,8,26,0.2541667,6,-4,26,0.173125,-1,7,23,1.5,-2,-3,21,0.4375,-5,9,13,0.4154771,-6,-7,21,0.6555,-9,-10,32,0.2236111,12,-15,6,19.5,-12,13,30,10.36667,-13,-14],[-0.00053277,-0.061786,-0.0098606,0.014199,-0.037602,0.018673,-0.01821,-0.051979,0.0053893,-0.030576,-0.036884,0.0063229,0.040043,-0.0094526,3.1141e-05]],[[42,4.775,-1,1,46,0.775,2,-15,26,0.2431667,3,6,10,0.06504438,-2,4,30,8.366667,5,-5,4,16754.5,-3,-4,4,16754.5,7,-14,30,5.875,8,13,1,340.0,-6,9,24,-1.811551,-7,10,10,0.005038071,-8,11,11,0.6446022,12,-11,21,0.2695,-9,-10,31,0.6333333,-12,-13],[-0.00032794,-0.0082511,0.0038159,-0.029408,0.02472,-0.0064238,0.023683,0.014797,0.0052838,-0.02125,0.016459,-0.053694,-0.0012491,0.01772,0.010911]],[[12,1.116145,1,10,23,9.5,2,9,4,7565.58,-1,3,23,8.5,4,-8,36,4.291667,5,-7,7,3.5,6,-6,21,0.3305,7,8,4,17911.53,-2,-3,0,0.871,-4,-5,4,4277.68,-9,-10,39,4.55,11,12,0,0.8384444,-11,-12,35,3.225,-13,13,28,0.32125,-14,-15],[0.00034779,-0.0036369,-0.04,-0.071909,0.020109,0.0041282,-0.017694,0.0034384,-0.037469,0.0027625,-0.024353,0.017958,0.017424,-0.0032722,-0.047606]],[[33,7563.5,1,3,16,0.2111111,2,-3,7,12.5,-1,-2,13,0.471507,4,13,36,8.583333,5,9,4,25979.4,6,-8,0,0.5173333,-4,7,29,0.4166667,-5,8,20,-0.7796492,-6,-7,33,8993.5,10,-13,2,15.5,-9,11,19,1e-35,12,-12,25,-2.398702,-10,-11,19,0.09761905,-14,-15],[-0.045855,0.032728,-0.00015383,0.0071979,-0.002692,-0.034702,0.0046663,0.025909,0.020295,0.019819,-0.030677,0.0015046,0.012399,0.030192,0.0054472]],[[33,7563.5,1,2,49,0.875,-1,-2,12,0.6934932,3,6,49,0.5833333,4,-6,35,9.9,5,-5,24,-0.8814572,-3,-4,5,8.5,-7,7,0,0.5326667,8,10,13,0.105304,-8,9,2,17.5,-9,-10,30,0.4166667,-11,11,20,-1.055824,12,13,2,34.5,-12,-13,12,0.9030164,-14,-15],[-0.00038386,0.0041888,-0.021431,0.024168,0.017624,-0.02506,0.0064692,0.021912,-0.050827,0.0026906,-0.0011153,-0.053645,0.00084395,0.005904,-0.031188]],[[42,4.775,1,6,28,0.189,2,3,8,1.252309,-1,-2,31,0.7083333,-3,4,19,0.3038462,5,-6,20,-1.610718,-4,-5,46,0.775,7,-15,26,0.2431667,-7,8,4,16754.5,9,-14,16,0.6333333,10,11,20,-1.055824,-8,-9,13,0.1356108,12,13,43,3.45,-10,-11,13,0.7717853,-12,-13],[-0.0098686,-0.00060716,-0.0010772,-0.018011,0.0099063,0.0083136,-0.0028405,0.01878,-0.039145,-0.0042592,0.021486,-0.0045565,0.026156,0.017381,0.010478]],[[33,7563.5,1,5,32,0.8066239,-1,2,5,7.5,3,-5,33,4004.75,4,-4,26,0.2995833,-2,-3,12,0.5426697,6,9,24,-1.407079,7,8,26,0.09225,-6,-7,24,-1.130075,-8,-9,22,0.902381,10,11,42,5.416667,-10,-11,20,-2.829149,12,-15,21,0.0255,13,-14,49,0.875,-12,-13],[0.0002385,-0.004114,-0.034879,0.0050014,-0.0072187,-0.0080115,0.037061,-0.024399,0.011922,-0.010874,0.0092506,0.056899,-0.011932,-0.023423,0.0084345]],[[16,0.4642857,1,11,48,0.5777778,2,10,19,0.9375,3,-9,19,0.5916667,4,8,32,0.4966667,5,6,8,7.923116,-1,-2,22,0.5527778,-3,7,4,23538.74,-4,-5,27,0.9444444,-6,9,2,61.5,-7,-8,20,-0.7796492,-10,-11,20,-0.5521725,-12,12,13,0.4500835,13,-15,26,0.6695,-13,-14],[-0.035555,0.021729,0.034325,-0.017522,0.011096,0.020557,-0.042509,0.014119,0.02038,0.041272,-0.018585,-1.9642e-05,0.014471,-0.036839,-0.0047027]],[[33,7563.5,1,3,16,0.2111111,2,-3,7,12.5,-1,-2,12,0.5426697,4,9,19,0.09761905,5,6,6,41.5,-4,-5,0,0.901,7,-9,7,5.5,8,-8,6,21.5,-6,-7,26,0.15625,10,13,50,0.4642857,11,12,12,0.9724273,-10,-11,4,12287.15,-12,-13,42,5.118056,-14,-15],[-0.046233,0.032198,-0.00015668,0.032199,-0.021638,0.001457,-0.048706,0.024535,0.018503,-0.021157,0.012089,0.0079916,0.028916,-0.0066615,0.0092148]],[[42,4.775,1,11,28,0.189,2,8,8,1.604726,3,7,2,17.5,4,6,43,2.366667,5,-3,6,3.5,-1,-2,6,13.5,-4,-5,8,6.979339,-6,-7,3,2.5,9,-11,32,0.7202941,10,-10,0,0.5557778,-8,-9,28,0.2055,12,13,46,0.775,-12,-13,21,0.2695,-14,-15],[-0.017299,0.0022138,0.0084087,-0.025569,-0.004693,-0.00036676,-0.01611,0.00010834,0.011089,-0.0053284,0.010082,0.0017529,0.010916,-0.0026139,-0.054047]],[[33,7563.5,1,11,49,0.875,2,6,32,0.9183333,-1,3,40,1e-35,4,-5,4,7473.597,5,-4,6,1e-35,-2,-3,21,0.2565,7,-11,4,1833.28,-6,8,2,8.5,-7,9,0,0.3326667,-8,10,24,-2.121798,-9,-10,13,0.471507,12,13,22,0.902381,-12,-13,19,0.09761905,-14,-15],[-0.00022745,0.035569,-0.040587,0.0024076,-0.040634,0.02421,-0.060574,0.020762,-0.0045934,0.0099866,-0.039506,-0.0050886,0.0057372,0.028664,0.0049912]],[[34,67.16667,1,7,32,0.3894444,2,4,21,0.6555,3,-3,33,1016.25,-1,-2,26,0.03125,5,-7,21,0.0225,-4,6,20,-1.483567,-5,-6,32,0.2236111,8,-15,6,19.5,9,-14,21,0.2545,10,13,35,5.633333,11,12,7,6.5,-8,-9,14,2778.5,-10,-11,26,0.31125,-12,-13],[5.2238e-05,-0.0085899,-0.028579,-0.023062,0.082122,-0.012673,-0.047626,0.0086079,0.053887,0.00097942,-0.062449,-0.034488,0.023005,0.028076,3.5155e-05]],[[18,0.4142857,1,-15,0,0.951,2,-14,0,0.8894444,3,11,0,0.7268889,4,10,4,15858.75,5,9,0,0.6605556,6,8,8,6.338773,7,-3,19,0.9375,-1,-2,5,1.5,-4,-5,5,6.5,-6,-7,12,0.7364633,-8,-9,36,6.291667,12,-13,45,0.2678571,13,-12,30,1.583333,-10,-11],[0.01446,-0.028159,-0.022425,0.018614,-0.043284,0.02418,-0.068237,0.04131,0.0088852,0.020977,-0.061987,0.025568,-0.051435,0.030432,-0.00011961]],[[18,0.4142857,1,-15,50,0.2916667,-1,2,12,0.7402762,-2,3,20,-1.9555,4,10,35,5.633333,5,8,20,-2.105185,6,7,24,-1.955818,-3,-4,24,-1.564064,-5,-6,20,-2.323763,-7,9,7,6.5,-8,-9,22,0.8867521,11,-14,14,12434.5,12,-13,39,5.291667,13,-12,7,5.5,-10,-11],[-0.042613,0.018356,-0.032029,0.015313,-0.068109,0.012293,-0.0017815,0.04256,-0.0049472,0.024939,-0.04887,0.034392,-0.045559,-0.04205,-0.00012818]],[[18,0.4142857,-1,1,15,-6.225642,2,11,38,2.416667,3,10,18,0.8819444,4,9,28,0.2136667,5,-7,34,83.16667,-2,6,26,0.1084167,7,8,26,0.061125,-3,-4,33,3804.25,-5,-6,25,-0.9430491,-8,-9,36,7.708333,-10,-11,16,0.3095238,12,-15,21,0.3535,-12,13,10,0.06012048,-13,-14],[0.0067872,-0.0064943,-0.034145,0.022044,-0.041298,0.0068532,0.0017682,-0.005303,0.033409,0.025963,-0.02367,-0.04336,0.029976,-0.025889,7.5715e-05]],[[13,0.003541388,1,13,42,1.225,2,10,37,1.225,3,6,15,-6.745587,-1,4,10,0.6658333,-2,5,2,18.5,-3,-4,21,0.0345,-5,7,2,17.5,8,9,14,1866.5,-6,-7,39,1.291667,-8,-9,19,0.4494949,-10,11,21,0.0825,-11,12,30,0.4166667,-12,-13,20,-4.603324,-14,-15],[-0.031624,0.024498,-0.043697,0.023226,-0.03836,-0.032287,0.012562,0.013013,-0.039896,-0.009414,0.01941,-0.033056,0.0058815,-0.02653,-0.00013306]],[[28,0.079,1,4,25,-1.411807,2,-4,24,-0.9342811,-1,3,7,2.5,-2,-3,34,26.0,5,6,13,0.7079062,-5,-6,13,0.2461284,7,13,38,6.708333,8,-13,24,-1.31372,-7,9,16,0.6333333,10,12,41,0.3666667,11,-10,24,-0.5243768,-8,-9,24,-1.052812,-11,-12,45,0.2678571,-14,-15],[0.0020408,-0.012506,0.0063282,-0.0026741,0.035946,-0.0027004,0.0011025,-0.015321,0.026001,0.0092654,0.0073839,0.021737,-0.012381,-0.0045745,0.0044376]],[[14,208.0,-1,1,34,55.25,2,10,4,1288.5,3,5,20,-2.105185,-2,4,28,0.069,-3,-4,0,0.373,6,-10,5,6.5,7,-9,4,1854.908,8,-8,5,3.5,-5,9,20,-1.483567,-6,-7,4,1015.247,11,-15,32,0.1160256,-11,12,34,137.1,13,-14,23,7.5,-12,-13],[0.010059,-0.0056796,0.0018295,0.01903,0.0021979,-0.04382,0.0043509,-0.037005,-0.0042204,0.0013519,0.0096516,-0.034438,0.0079907,0.015713,0.00050247]],[[13,0.003541388,1,8,42,1.225,2,6,43,0.7916667,3,4,4,1489.5,-1,-2,2,22.5,5,-5,27,0.9444444,-3,-4,19,0.4494949,-6,7,6,1.5,-7,-8,36,7.55,-9,9,4,2452.0,10,11,0,0.925,-10,-11,6,18.5,-12,12,19,0.9375,13,-15,24,-1.171975,-13,-14],[-0.0025127,0.022541,-0.030294,0.0089671,-0.03291,-0.0082339,-0.019978,0.011521,-0.00067181,-0.016092,0.053567,0.0036707,-0.012418,0.0027771,0.01734]],[[26,0.6695,1,11,26,0.6655,2,9,26,0.6115,-1,3,24,-1.180848,4,5,26,0.6555,-2,-3,20,-0.8236623,6,8,26,0.6555,7,-6,4,1239.5,-4,-5,26,0.6145,-7,-8,4,3513.5,10,-11,4,1489.5,-9,-10,4,1833.28,12,-15,0,0.111,13,-14,9,1.523544,-12,-13],[9.067e-05,0.018561,-0.034442,0.0057546,-0.059855,0.016636,-0.016988,0.015418,-0.016115,0.02724,-0.039643,0.040763,-0.027404,-0.061559,0.006564]],[[42,4.775,1,6,28,0.189,2,3,15,-6.992559,-1,-2,24,-1.514122,-3,4,13,0.1771284,-4,5,9,1.357921,-5,-6,46,0.775,7,13,26,0.2431667,8,9,21,0.1375,-7,-8,13,0.7717853,10,-13,22,0.08893281,11,-12,25,-0.3669371,12,-11,15,-1.935967,-9,-10,24,-2.512067,-14,-15],[-0.017173,-0.00066413,-0.00030098,0.013035,0.0053926,-0.016783,0.00029873,-0.01199,-0.022007,0.023668,-0.044405,0.0054183,0.025228,-0.01925,0.011794]],[[18,0.4142857,-1,1,24,-1.216559,2,7,30,10.125,3,-7,30,8.366667,4,5,30,5.55,-2,-3,22,0.6414286,-4,6,4,13298.0,-5,-6,10,0.1350676,8,13,18,0.7638889,-8,9,6,5.5,10,-13,4,5662.945,11,-12,33,1874.167,12,-11,21,0.4325,-9,-10,26,0.213125,-14,-15],[0.0065471,-0.00028695,-0.0096677,0.036977,-0.013478,0.023618,-0.014023,0.014653,0.0019992,-0.015554,0.0069206,-0.024602,0.0049593,0.0065622,-0.0087798]],[[42,4.775,-1,1,46,0.775,2,12,26,0.2431667,3,5,10,0.06504438,4,-4,34,842.5,-2,-3,0,0.8221111,6,-12,0,0.6942222,7,11,16,0.6333333,-5,8,13,0.1386541,-6,9,13,0.6835961,10,-9,32,0.08514493,-7,-8,20,-2.279991,-10,-11,45,0.4642857,-13,13,15,-2.820086,-14,-15],[-0.00031871,-0.0095158,0.015854,0.0032558,-0.01705,0.015177,-0.029604,0.00091365,0.021381,0.02038,-0.016355,0.012916,-0.0085816,0.0024895,0.020711]],[[42,4.775,1,10,12,1.129688,2,-10,28,0.189,3,5,16,0.7083333,4,-3,4,1878.195,-1,-2,24,-1.514122,6,7,24,-1.564064,-4,-5,12,0.768541,-6,8,2,31.5,-7,9,20,-1.916581,-8,-9,48,0.2916667,-11,11,21,0.0325,-12,12,12,0.9952772,13,-15,40,0.2916667,-13,-14],[0.013893,-0.0062725,-0.00015619,0.00066836,-0.018531,0.00050395,0.015132,0.024492,-0.035133,-0.0089955,0.0029804,0.0052369,-0.006665,-0.069099,0.019466]],[[42,4.775,1,4,21,0.1395,-1,2,26,0.152125,3,-4,22,0.6978261,-2,-3,26,0.2721667,5,6,21,0.2695,-5,-6,21,0.2825,7,8,26,0.31825,-7,-8,13,0.7597063,9,-15,33,1907.25,-9,10,14,2918.5,11,12,13,0.05499832,-10,-11,13,0.105304,-12,13,33,5413.5,-13,-14],[0.00072323,-0.0054912,-0.045407,-0.00075572,0.00078677,-0.044187,0.02171,-0.0070961,-0.013899,0.032034,0.0067652,-0.013377,-0.01251,0.011587,0.023692]],[[14,208.0,-1,1,34,67.16667,2,11,4,1288.5,3,5,20,-2.513501,4,-4,24,-2.533368,-2,-3,0,0.287,6,10,21,0.1285,7,8,4,2161.47,-5,-6,34,47.25,-7,9,24,-2.194044,-8,-9,20,-2.4513,-10,-11,4,1077.0,12,13,11,1.605888,-12,-13,14,706.5,-14,-15],[0.0096148,-0.0029124,-0.051411,0.0079552,0.011729,-0.023948,-0.014748,-0.06331,-0.010406,0.017334,-0.0050215,-0.019417,0.027674,0.015319,0.00031212]],[[21,0.6695,1,12,21,0.6605,2,10,21,0.6115,-1,3,24,-1.180848,4,5,21,0.6555,-2,-3,20,-0.8236623,6,7,4,1147.5,-4,-5,6,26.5,8,9,0,0.201,-6,-7,20,-0.6636715,-8,-9,20,-1.253368,-10,11,4,3513.5,-11,-12,4,1878.195,13,-15,0,0.169,-13,-14],[8.1136e-05,0.017946,-0.031118,0.0075683,-0.055857,0.032827,-0.029329,0.046995,-0.0071462,-0.041426,0.024982,-0.039842,-0.0097255,-0.067606,0.0080044]],[[27,0.9444444,1,-15,4,14196.0,2,-14,26,0.141125,3,13,29,0.55,4,12,34,440.5,5,-9,1,340.0,6,8,34,33.625,-1,7,20,-1.800355,-2,-3,20,-2.01323,9,11,2,29.5,10,-6,22,0.9110672,-4,-5,4,6152.7,-7,-8,2,19.5,-10,-11,45,0.225,-12,-13],[-0.049096,0.02312,-0.0030105,-0.029979,0.025412,0.013616,0.0053441,-0.037093,0.019153,0.023825,-0.0032461,-0.038171,-0.0011006,-0.026265,0.00021093]],[[25,-3.12918,-1,1,9,5.557174,2,-15,28,0.079,3,9,26,0.1381667,4,7,4,15386.19,5,-5,4,771.5,-2,6,5,9.5,-3,-4,26,0.1481667,8,-8,35,7.633333,-6,-7,47,0.2678571,10,13,26,0.2721667,11,12,26,0.2701667,-9,-10,26,0.2995833,-11,-12,9,2.012966,-13,-14],[0.0056271,-0.018076,0.00074161,0.0098842,-0.02205,-0.0093492,-0.045263,-0.0016671,-0.0015156,-0.036892,0.010844,0.0011559,0.0065391,-0.0042893,-0.023484]],[[18,0.4142857,-1,1,24,-1.216559,2,10,30,10.125,3,-10,30,8.366667,4,-9,30,5.55,-2,5,2,33.5,6,-8,50,0.4642857,7,8,13,0.2493618,-3,-4,19,0.4365079,-5,9,36,3.225,-6,-7,10,0.1350676,11,13,18,0.7638889,12,-13,19,0.1380952,-11,-12,26,0.213125,-14,-15],[0.0061665,-0.00029,0.032527,-0.015691,-0.034449,0.023167,-0.017963,0.0080652,0.015056,-0.013225,-0.039393,0.015359,0.0016968,0.0060384,-0.0085497]],[[26,0.6715,1,13,20,-0.5521725,2,8,16,0.55,3,-7,8,1.252309,-1,4,31,0.3666667,-2,5,2,19.5,6,-6,4,1878.195,7,-5,20,-1.103357,-3,-4,4,11196.95,9,11,7,5.5,10,-10,26,0.6105,-8,-9,22,0.8297101,-11,12,7,10.5,-12,-13,4,1878.195,-14,-15],[-0.048289,0.011762,-0.021914,0.029049,-0.022976,-0.00035945,0.00016467,0.011066,-0.011983,0.025184,-0.041418,0.010866,-0.044583,-0.050964,0.0035822]],[[31,0.775,1,4,6,16.5,-1,2,23,9.5,3,-4,48,0.7083333,-2,-3,6,2.5,5,11,0,0.181,-5,6,7,3.5,7,9,0,0.6452222,8,-8,5,1.5,-6,-7,23,2.5,-9,10,24,-1.035583,-10,-11,32,0.4220648,-12,12,15,-4.780576,-13,13,0,0.369,-14,-15],[4.9723e-06,-0.029662,0.026076,-0.0049435,0.0049077,-0.037815,-0.008299,-0.04597,-0.029294,-0.0019385,0.026912,0.0067399,-0.0081068,0.0094022,0.00014154]],[[9,2.773712,-1,1,5,8.5,2,13,34,160.125,3,8,12,1.020732,4,-7,2,20.5,5,-6,4,1949.5,6,-5,13,0.4287087,-2,7,29,0.4166667,-3,-4,4,2161.47,9,10,35,8.9,-8,-9,6,14.5,11,-13,32,0.6757353,12,-12,4,9290.585,-10,-11,1,340.0,-14,-15],[-0.00037224,-0.014813,0.018368,-0.012506,-0.014674,0.0061379,0.013403,-0.032465,0.028635,0.032868,-0.025693,0.0065528,-0.0087142,0.01782,0.0046412]],[[16,0.4642857,1,-15,48,0.5777778,2,13,0,0.951,3,-12,29,0.775,-1,4,24,-1.19263,-2,5,20,-1.033842,6,10,26,0.34925,7,-7,32,0.7091049,8,9,32,0.4183333,-3,-4,32,0.8580586,-5,-6,30,14.70833,-8,11,32,0.4966667,-9,12,32,0.6160256,-10,-11,34,62.75,-13,-14],[0.019969,-0.044697,0.029838,-0.029823,0.066419,-0.02137,-0.021675,-0.035876,-0.037115,0.028627,-0.016219,0.011431,-0.019698,0.038501,0.0001056]],[[10,0.8402128,1,12,24,-1.374317,-1,2,0,0.109,-2,3,21,0.4295,4,10,10,0.1852152,5,-9,6,11.5,6,-8,2,14.5,7,9,6,3.5,8,-5,2,9.5,-3,-4,33,1323.25,-6,-7,5,9.5,11,-12,33,1501.167,-10,-11,25,-0.1243706,13,-15,24,-2.533368,-13,-14],[-0.0010401,0.015725,0.010568,-0.0059415,0.015496,0.0068195,-0.011806,0.0080255,-0.0034924,-0.01262,0.0050585,-0.015192,0.0091399,-0.0034174,0.026992]],[[9,2.773712,-1,1,5,8.5,2,-15,34,160.125,3,8,12,1.020732,4,-7,37,1.45,5,7,4,1874.5,-2,6,6,1.5,-3,-4,4,1702.575,-5,-6,4,2161.47,9,10,23,8.5,-8,-9,6,14.5,11,-14,32,0.6757353,12,13,12,0.2577999,-10,-11,4,3584.5,-12,-13],[-0.00038032,0.0025473,-0.030311,-0.012217,-0.019731,0.0045676,0.012753,-0.031852,0.028044,-0.013168,0.032445,-0.010204,0.011212,-0.0081938,0.0080814]],[[18,0.4142857,1,-15,0,0.951,2,-14,46,0.6333333,3,11,43,4.633333,4,7,6,22.5,-1,5,36,4.472222,-2,6,32,0.7154762,-3,-4,19,0.4833333,8,-9,47,0.1388889,9,-8,29,0.55,-5,10,30,17.29167,-6,-7,21,0.0925,12,-13,24,-1.715112,13,-12,33,2905.5,-10,-11],[-0.004879,0.032335,-0.021609,0.021219,0.01941,-0.072737,0.016897,0.028604,0.037267,-0.025616,0.032345,-0.067731,0.025659,0.029257,-0.00011205]],[[9,2.773712,1,7,28,0.079,2,-7,40,0.775,-1,3,24,-3.688415,-2,4,48,0.6333333,5,6,22,0.1026316,-3,-4,15,-2.853744,-5,-6,38,0.775,8,10,25,-1.572033,-8,9,24,-0.8814572,-9,-10,21,1e-35,-11,11,26,0.01883333,-12,12,4,1833.28,13,-15,4,1801.528,-13,-14],[-0.0042121,0.035753,-0.011232,0.0016413,0.011232,-0.041874,0.00097789,0.0028922,-0.006679,0.024105,-0.015467,0.058773,0.016854,0.10154,0.0059163]],[[18,0.4142857,1,-15,43,4.366667,2,13,6,22.5,3,9,2,19.5,4,5,0,0.3884444,-1,-2,31,0.6333333,6,8,6,9.5,-3,7,20,-2.222537,-4,-5,20,-1.750965,-6,-7,36,3.366667,-8,10,0,0.7057778,11,12,4,10056.84,-9,-10,36,4.291667,-11,-12,28,0.1091667,-13,-14],[-0.012062,0.0224,0.029828,-0.058883,0.022786,-0.055456,0.010708,0.036885,0.0064466,-0.07446,-0.039341,0.014634,-0.016406,0.02145,-0.00012064]],[[12,1.116145,1,12,23,9.5,2,4,4,7565.58,-1,3,23,8.5,-2,-3,4,4277.68,-4,5,5,8.5,6,8,6,22.5,-5,7,19,0.9375,-6,-7,2,12.5,9,-12,26,0.02125,10,11,26,0.01625,-8,-9,14,6244.5,-10,-11,32,0.3920807,-13,13,4,1147.5,-14,-15],[0.00032801,-0.0094371,0.002838,-0.03579,0.0085022,-0.004077,0.028077,-0.02801,0.046626,-0.067314,-0.011565,-0.00025643,0.0099441,-0.032186,-0.007468]],[[13,0.003541388,1,-15,33,1323.25,2,4,47,0.4642857,3,-3,11,-0.7550033,-1,-2,36,8.733333,5,-14,37,0.9444444,6,7,42,1.225,-4,-5,26,0.04025,8,9,1,340.0,-6,-7,4,1414.725,-8,10,15,-2.577623,11,13,21,0.0825,-9,12,40,0.4142857,-10,-11,24,-1.604705,-12,-13],[-0.036143,0.0061988,0.0045092,0.026866,0.0046179,0.012038,-0.049533,0.036259,0.013828,-0.032887,-0.0024758,-0.025291,0.02623,-0.017194,-0.00015234]],[[25,-3.12918,-1,1,9,5.557174,2,-15,24,-0.5529546,3,12,30,42.125,4,11,30,34.83333,5,-9,30,22.9,6,9,30,20.1,-2,7,19,0.6458333,-3,8,22,0.8973684,-4,-5,34,498.375,10,-8,24,-1.407079,-6,-7,24,-0.9342811,-10,-11,10,0.06504438,-12,13,19,0.19375,-13,-14],[0.0053755,-0.00017199,-0.052501,-0.023697,0.04424,-0.032319,0.026017,-0.017729,-0.033412,-0.022619,0.046553,0.010385,0.03626,-0.013902,-0.022634]],[[18,0.4142857,1,2,50,0.2916667,-1,-2,9,2.773712,-3,3,38,0.775,4,12,2,14.5,5,7,20,-2.058361,6,-6,6,4.5,-4,-5,6,8.5,8,-12,7,1e-35,-7,9,19,0.3038462,10,-11,0,0.509,11,-10,34,170.1667,-8,-9,14,1488.5,13,-15,0,0.131,-13,-14],[-0.039711,0.0073248,-0.00051382,-0.0049536,-0.031721,0.0020458,-0.00084058,-0.002963,0.029148,0.041645,-0.0006096,-0.0014434,-0.0063805,0.022288,0.002422]],[[31,0.775,1,8,6,9.5,-1,2,2,22.5,3,5,20,-1.506167,4,-4,7,1e-35,-2,-3,6,21.5,6,-8,21,0.0865,-5,7,10,0.1750706,-6,-7,6,2.5,9,10,0,0.181,-9,-10,10,0.2204651,11,13,2,14.5,-11,12,6,9.5,-12,-13,16,0.7083333,-14,-15],[0.00052096,0.0087579,-0.025193,-0.065476,-0.0085869,-0.00047893,0.023829,-0.016859,0.0046595,-0.0082411,0.010384,-0.006355,0.0049642,-0.01078,0.0014557]],[[10,0.8402128,1,10,20,-2.428472,2,7,20,-2.548917,3,4,38,0.2916667,-1,-2,2,15.5,5,-6,4,1271.43,-3,6,22,0.2649123,-4,-5,24,-2.276144,8,-10,24,-2.323985,-7,9,35,1.844444,-8,-9,25,-0.1243706,11,13,26,0.1381667,12,-13,5,10.5,-11,-12,26,0.105125,-14,-15],[-0.0027051,0.0046173,0.0009988,-0.053477,-0.017949,0.002532,0.00051932,-0.044612,0.023489,8.7312e-05,0.0032089,0.029944,-0.0050058,-0.0079401,0.031739]],[[10,0.8402128,1,10,24,-1.374317,-1,2,10,0.1852152,3,-10,6,14.5,4,6,2,22.5,-2,5,25,-0.2475359,-3,-4,26,0.31475,7,8,16,0.2678571,-5,-6,24,-1.19263,9,-9,2,34.5,-7,-8,25,-0.1243706,11,13,26,0.1381667,12,-13,5,10.5,-11,-12,26,0.105125,-14,-15],[-0.00099886,0.0024112,-0.0066112,-0.027433,-0.042039,0.012208,-0.046892,0.0081217,0.0042537,-0.0040889,0.003243,0.028217,-0.0050468,-0.0077997,0.028434]],[[18,0.4142857,-1,1,9,2.773712,-2,2,5,8.5,3,-15,34,160.125,4,7,5,1.5,5,-6,6,3.5,6,-5,26,0.11425,-3,-4,4,2161.47,8,9,35,8.9,-7,-8,6,14.5,10,-14,22,0.6733333,11,12,4,8882.714,-9,-10,4,3873.5,-11,13,24,-1.811551,-12,-13],[0.0061131,-0.00050409,0.048706,0.0066175,-0.01029,-0.0054264,-0.031243,0.026416,0.027946,-0.028804,-0.0089545,0.018289,-0.0056619,-0.0075128,0.0072026]],[[23,9.5,1,6,4,7565.58,-1,2,23,8.5,3,-6,5,8.5,4,-5,6,12.5,5,-4,19,0.5916667,-2,-3,4,4790.73,7,9,29,0.9444444,8,-9,13,0.2461284,-7,-8,5,7.5,10,12,6,25.5,-10,11,19,0.9375,-11,-12,4,10756.5,13,-15,2,27.5,-13,-14],[0.00020855,-0.018259,-0.063247,-0.0072504,-0.00059013,0.0024851,-0.047289,0.0068875,-0.002768,0.0088929,-0.0053872,0.027514,-0.0028137,-0.035206,0.0032827]],[[23,9.5,1,3,4,17265.39,-1,2,22,0.8867521,-2,-3,4,4165.375,4,6,0,0.6894444,5,-6,20,-2.684075,-4,-5,0,0.513,7,9,1,340.0,8,-9,20,-3.342644,-7,-8,12,0.8996027,10,-15,4,4664.0,-10,11,40,0.7321429,12,13,2,12.5,-11,-12,0,0.565,-13,-14],[-0.00024014,-0.023859,0.00019311,-0.0031277,-0.059016,0.00087283,0.037049,-0.037912,0.0067462,-0.047077,-0.034542,0.00050894,-0.020087,0.010284,-0.0046959]],[[23,9.5,1,6,4,17265.39,-1,2,22,0.8867521,3,-6,7,2.5,-2,4,22,0.7958333,5,-5,20,-0.6152254,-3,-4,4,4165.375,7,9,29,0.9444444,-7,8,20,-2.260635,-8,-9,6,23.5,10,12,36,3.366667,11,-12,49,0.5833333,-10,-11,36,3.291667,-13,13,4,7848.2,-14,-15],[-0.00024994,-0.04061,0.01349,-0.050452,-0.058838,-0.00022012,-0.051999,0.057155,-0.010917,-0.043066,0.027897,0.0041208,0.042807,-0.019572,-0.00073975]],[[25,-2.795782,1,2,15,-4.12569,-1,-2,19,0.3484848,3,8,6,4.5,4,6,37,1.291667,-3,5,4,1555.5,-4,-5,2,15.5,-6,7,11,-0.1375116,-7,-8,6,3.5,9,10,0,0.565,-9,-10,10,0.2204651,11,13,2,15.5,-11,12,6,9.5,-12,-13,25,-0.1243706,-14,-15],[0.005896,-0.0082722,-0.001313,-0.018834,0.0061393,-0.015476,-0.0097566,-0.00030646,-0.0035452,-0.025659,0.013239,-0.0076168,0.0054914,-0.0055761,0.0073353]],[[23,9.5,-1,1,43,6.775,2,13,21,0.1335,3,6,0,0.851,4,5,12,1.036434,-2,-3,19,0.5227273,-4,-5,2,13.5,7,9,20,-1.449363,8,-8,32,0.9240385,-6,-7,12,0.5134965,10,11,19,0.1622807,-9,-10,0,0.8384444,-11,12,18,0.6333333,-12,-13,30,2.1,-14,-15],[-0.00046697,0.0062671,-0.013085,-0.017034,0.0091229,-0.051346,0.017427,-0.00096063,0.025709,0.0033995,-0.0075254,0.021568,-0.0033282,0.017781,0.00058431]],[[42,4.775,-1,1,46,0.775,2,13,26,0.2431667,3,7,10,0.06504438,-2,4,30,8.366667,5,6,4,16754.5,-3,-4,30,14.55,-5,-6,4,16754.5,8,-13,13,0.7717853,9,-12,13,0.2650788,10,-11,35,7.291667,-7,11,2,15.5,-8,12,30,4.708333,-9,-10,24,-2.512067,-14,-15],[-0.00030904,-0.0075386,0.0036653,-0.024281,0.033979,-0.017749,0.013288,-0.050474,0.005794,-0.02251,-0.0076121,0.023168,0.015265,-0.017284,0.011185]],[[42,4.775,-1,1,28,0.2055,2,13,23,9.5,3,12,4,5856.015,4,10,26,0.6075,5,8,30,10.36667,6,-5,46,0.9166667,-2,7,24,-1.896543,-3,-4,4,2352.5,9,-8,12,0.7364633,-6,-7,6,22.5,11,-11,5,5.5,-9,-10,2,15.5,-12,-13,26,0.2691667,-14,-15],[-0.00031918,0.00077437,-0.01466,0.021497,-0.031336,-0.036577,0.011529,0.026475,-0.024595,-0.0043607,0.0035911,-0.020349,0.0088889,-0.0037628,-0.035026]],[[42,4.775,-1,1,2,18.5,2,7,42,7.416667,3,-7,11,0.6446022,4,-6,24,-1.715112,-2,5,13,0.5073131,-3,6,6,5.5,-4,-5,32,0.4528571,-8,8,23,9.5,9,12,4,4440.5,-9,10,6,25.5,11,-12,36,6.828571,-10,-11,24,-1.763591,13,-15,21,0.0685,-13,-14],[-0.00032152,-0.0089834,0.0056386,-0.046046,0.00087162,0.012491,-0.035746,0.015063,0.011688,-0.023852,-0.0041893,0.0042512,-0.008384,0.023366,0.0033635]],[[13,0.003541388,1,-15,33,1323.25,2,8,39,4.125,3,5,28,0.2407143,4,-3,24,-1.067786,-1,-2,16,0.55,6,7,39,5.844444,-4,-5,24,-1.876648,-6,-7,39,1.366667,-8,9,48,0.225,10,12,5,9.5,-9,11,33,1829.25,-10,-11,8,4.597832,13,-14,8,2.694769,-12,-13],[-0.036575,0.011643,0.019869,0.0057561,-0.057947,-0.0064719,0.024141,0.022033,-0.0017368,0.038188,0.0033389,-0.0015236,0.038859,-0.015313,-0.00015145]],[[13,0.003541388,1,7,41,0.3095238,2,4,39,8.1,3,-3,5,10.5,-1,-2,37,1.916667,5,6,15,-6.992559,-4,-5,22,0.6602564,-6,-7,20,-4.603324,-8,8,9,3.629933,-9,9,37,1e-35,10,11,25,-1.286995,-10,-11,2,8.5,12,-15,24,-1.360302,-12,13,4,1773.0,-13,-14],[-0.018111,0.019911,0.0053445,-0.021304,0.017947,-0.038274,0.0098759,-0.025086,-0.00038112,0.013638,-0.0067928,-0.026683,-0.029733,0.043551,0.0034182]],[[42,4.775,1,6,12,1.129688,2,5,28,0.189,-1,3,24,-1.514122,-2,4,12,0.7729462,-3,-4,0,0.831,-5,-6,46,0.775,7,12,10,0.1003145,8,-12,26,0.2431667,-7,9,12,0.3173573,-8,10,32,0.08514493,11,-11,25,-0.3669371,-9,-10,45,0.3666667,-13,13,15,-2.820086,-14,-15],[-0.00066202,-0.00032831,6.5707e-05,0.012538,-0.011653,0.012034,-0.0056377,0.018306,0.0017732,-0.040043,0.002873,0.0062627,-0.0097527,0.0033482,0.019175]],[[42,4.775,-1,1,46,0.775,2,12,8,2.868042,3,4,15,-2.786682,-2,-3,26,0.2328333,5,11,12,0.9724273,6,-10,0,0.591,-4,7,20,-3.07476,-5,8,30,7.9,9,10,25,-0.283159,-6,-7,30,14.55,-8,-9,19,0.4833333,-11,-12,45,0.3666667,-13,13,15,-2.820086,-14,-15],[-0.00034157,-0.019022,0.00029752,-0.0091653,0.02165,0.0024046,-0.020747,0.030993,-0.035194,0.015059,0.017348,-0.00028472,-0.0086658,0.0031465,0.018612]],[[42,4.775,1,7,12,1.116145,-1,2,0,0.831,3,6,39,6.708333,-2,4,35,3.225,-3,5,35,5.366667,-4,-5,40,0.775,-6,-7,28,0.1808333,8,12,28,0.179,9,-12,24,-2.464131,-8,10,20,-2.375678,-9,11,46,0.775,-10,-11,8,1.252309,13,-15,23,6.5,-13,-14],[-0.00021052,-0.021429,0.01764,-0.021078,0.0031456,0.024631,-0.017294,-0.0049668,0.021021,0.0013207,0.010203,0.029959,-0.050489,-0.0094662,-0.0009157]],[[13,0.003541388,1,-15,41,0.3095238,2,13,39,8.1,3,5,26,0.126125,-1,4,0,0.169,-2,-3,21,0.0955,6,8,25,-1e-35,7,-6,15,-5.157065,-4,-5,15,-2.42807,9,12,1,340.0,-7,10,0,0.721,11,-10,20,-2.495186,-8,-9,12,1.000001,-11,-12,43,2.775,-13,-14],[-0.032096,0.021111,-0.010448,-0.0078996,0.023727,-0.022599,0.011478,0.00034753,-0.034368,0.0075091,0.028091,-0.014426,0.013587,-0.0063612,-0.00015374]],[[42,4.775,-1,1,37,2.291667,2,3,3,2.5,-2,-3,14,2962.5,4,5,14,2133.5,-4,-5,34,286.0833,6,10,13,0.2915851,7,8,42,5.291667,-6,-7,25,-0.2938898,-8,9,6,15.5,-9,-10,37,3.267857,-11,11,2,15.5,-12,12,6,20.5,13,-15,5,4.5,-13,-14],[-0.00033437,-0.0012382,0.019993,0.0010282,0.020872,0.0079955,-0.013322,0.0017367,-0.037591,-0.005382,0.033485,-0.026047,0.016098,-0.0042334,-0.0020261]],[[42,4.775,-1,1,37,2.291667,2,13,2,18.5,3,10,11,0.6446022,4,-9,21,0.1235,5,7,21,0.0395,6,-4,0,0.4826667,-2,-3,5,3.5,-5,8,21,0.3215,-6,9,28,0.09366667,-7,-8,32,0.4528571,-10,11,0,0.8057778,12,-13,30,5.416667,-11,-12,14,2962.5,-14,-15],[-0.00033615,-0.00308,-0.039224,0.0043124,0.0062453,-0.025849,0.0078353,-0.022796,0.011362,0.014086,-0.0018544,-0.024544,0.0088863,0.015427,0.0027993]],[[21,0.1395,1,7,37,7.833333,2,-7,19,0.4365079,3,-6,4,2140.345,4,6,21,0.1335,5,-3,4,771.5,-1,-2,20,-2.548917,-4,-5,26,0.152125,8,-15,22,0.6978261,9,13,5,1.5,-8,10,21,0.1435,-9,11,37,0.9444444,12,-12,21,0.1455,-10,-11,4,1461.0,-13,-14],[-0.019439,0.0035825,0.032323,0.00082454,-0.0071506,0.0034663,0.016725,-0.04528,0.011651,0.030352,-0.010063,-0.041237,0.018187,-0.058221,-0.00020691]],[[42,4.775,-1,1,37,2.291667,2,3,3,2.5,-2,-3,4,4790.73,-4,4,34,285.25,-5,5,24,-2.577058,-6,6,24,-1.763591,7,10,2,18.5,8,9,21,0.1665,-7,-8,23,9.5,-9,-10,16,0.7083333,11,12,4,16754.5,-11,-12,19,0.19375,13,-15,7,1e-35,-13,-14],[-0.00034614,-0.00083148,0.020346,0.015354,-0.0070499,-0.022416,0.010742,-0.050987,-0.012166,0.036371,-0.030814,0.0031213,0.007115,-0.045053,0.014246]],[[42,4.775,-1,1,28,0.2055,2,13,23,9.5,3,12,4,4965.5,4,9,5,8.5,5,6,48,0.9,-2,-3,11,0.6446022,7,-7,4,1077.0,-4,8,21,0.0655,-5,-6,22,0.4721362,-8,10,6,25.5,11,-11,22,0.6132479,-9,-10,2,15.5,-12,-13,21,0.2705,-14,-15],[-0.00033678,0.0098925,-0.015129,0.02111,0.012136,-0.020662,0.016237,0.0074812,-0.029742,-0.0068807,0.0023953,-0.017434,0.0078461,-0.0015548,-0.048441]],[[42,4.775,-1,1,45,0.5857143,2,-15,28,0.2407143,3,-14,30,11.1,4,10,4,13298.0,5,8,4,4790.73,6,7,42,5.875,-2,-3,30,2.875,-4,-5,2,26.5,9,-8,35,9.291667,-6,-7,30,18.41429,11,-13,35,6.708333,12,13,44,0.4142857,-9,-10,21,0.276,-11,-12],[-0.00034429,0.0067449,-0.019849,-0.00040598,-0.013563,-0.026856,0.014986,0.015026,0.016756,-0.032328,-0.060621,-0.0016881,0.0092396,-0.017684,0.0054537]],[[42,4.775,-1,1,37,2.291667,2,5,3,2.5,3,-5,11,0.6446022,4,-4,4,13298.0,-2,-3,4,4531.135,6,7,33,2048.583,-6,-7,24,-2.554678,-8,8,24,-1.896543,9,10,2,16.5,-9,-10,26,0.1622667,11,13,35,7.464286,12,-13,32,0.5297059,-11,-12,35,4.9,-14,-15],[-0.00034925,-0.0050282,0.0068216,0.0084861,0.018758,-0.004893,0.018576,-0.018432,-0.010384,0.023196,0.015784,-0.029291,0.0242,-0.025388,-0.00036473]],[[42,4.775,-1,1,37,2.291667,2,7,1,340.0,3,-7,38,5.875,4,5,11,0.8143391,-2,-3,13,0.2691837,6,-6,21,0.1235,-4,-5,4,4854.5,8,9,33,2048.583,-8,-9,23,9.5,-10,10,0,0.3615556,-11,11,30,2.1,-12,12,30,19.41667,13,-15,21,0.0755,-13,-14],[-0.00034763,-0.013961,0.01891,0.01782,-0.024295,0.020475,0.002339,-0.003889,0.016677,-0.0053033,-0.028537,0.015967,0.014677,-0.0061873,0.023856]],[[42,4.775,1,-15,28,0.189,2,3,15,-6.992559,-1,-2,6,10.5,4,13,21,0.0565,5,9,31,0.45,6,8,26,0.173125,7,-5,26,0.0421,-3,-4,32,0.09569597,-6,-7,12,0.7485033,-8,10,38,4.291667,11,-12,12,1.129688,-9,12,32,0.1214035,-10,-11,32,0.4183333,-13,-14],[-0.017035,-0.00061551,0.0061951,-0.014638,0.03261,0.025046,-0.0233,-0.0039351,0.0086146,0.029672,-0.044352,-0.027853,0.013808,0.002446,0.0024549]],[[42,4.775,-1,1,37,2.291667,2,3,3,2.5,-2,-3,4,4854.5,-4,4,0,0.3268889,-5,5,34,286.0833,-6,6,24,-2.577058,-7,7,24,-1.763591,8,11,23,9.5,-8,9,2,18.5,10,-11,26,0.213125,-9,-10,26,0.1622667,-12,12,11,-0.1375116,13,-15,16,0.7083333,-13,-14],[-0.00032449,-0.00079003,0.017731,0.012987,-0.033553,-0.0050649,-0.020674,-0.010741,0.029071,-0.045897,0.032862,0.0247,-0.032957,-0.0015444,0.0055251]],[[42,4.775,1,-15,28,0.189,2,6,15,-6.992559,-1,3,44,0.6333333,-2,4,20,-1.213239,-3,5,0,0.321,-4,-5,31,0.7083333,7,9,43,7.366667,8,-8,0,0.9278889,-6,-7,47,0.2678571,10,12,7,11.5,11,-11,34,60.25,-9,-10,10,0.0150188,-12,13,21,0.0965,-13,-14],[-0.016705,-1.8656e-05,-0.0059226,0.016994,-0.00025783,-9.4221e-05,-0.02436,-0.039622,-0.030927,0.0032984,-0.033901,0.02587,0.017783,-0.0083136,0.0023235]],[[18,0.4142857,1,-15,0,0.7268889,2,11,46,0.6333333,3,-10,21,0.0835,4,8,21,0.0705,5,-5,46,0.3095238,6,-4,38,2.708333,7,-3,20,-1.973402,-1,-2,5,2.5,9,10,4,4736.65,-6,-7,4,4118.09,-8,-9,21,0.0835,12,-14,22,0.7752525,13,-13,36,3.1,-11,-12],[-0.014742,0.026921,-0.050459,0.02618,0.033277,-0.0275,0.017994,0.016933,-0.061922,-0.029097,0.013807,-0.056207,0.0099616,0.029452,-0.00011301]],[[18,0.4142857,1,-15,50,0.2916667,-1,2,12,0.7402762,-2,3,21,0.0185,4,7,35,4.55,-3,5,26,0.2211667,6,-6,19,0.9375,-4,-5,21,0.0255,-7,8,0,0.9394444,9,-14,0,0.8942222,10,13,21,0.1325,11,12,21,0.1145,-8,-9,46,0.1833333,-10,-11,32,0.5345238,-12,-13],[-0.041508,0.01776,0.016756,-0.055405,0.015287,0.018496,0.0342,0.005098,0.041057,-0.055511,0.014489,0.0098701,-0.065691,0.033552,-0.00011555]],[[18,0.4142857,-1,1,42,4.775,2,-15,44,0.5357143,3,5,26,0.03125,-2,4,26,0.03775,-3,-4,10,0.2204651,6,13,24,-1.604705,7,9,43,0.7916667,-5,8,36,6.828571,-6,-7,47,0.4642857,10,12,24,-1.171975,-8,11,26,0.6115,-9,-10,30,13.41667,-11,-12,25,-0.1243706,-13,-14],[0.0063936,0.0043704,-0.019779,-3.1108e-05,-0.0017912,-0.025498,-0.0019734,-0.0047172,0.0068596,-0.020866,0.020344,-0.020259,-0.010951,0.0048045,0.0020414]],[[21,0.2685,-1,1,21,0.276,2,6,21,0.2705,3,4,2,7.5,-2,-3,36,8.45,-4,5,26,0.283125,-5,-6,21,0.2815,7,8,19,0.1742424,-7,-8,21,0.2855,-9,9,21,0.2975,-10,10,26,0.31125,11,-15,33,1542.25,12,13,26,0.3051667,-11,-12,21,0.2985,-13,-14],[0.00047888,-0.055208,-0.0022723,-0.048138,0.042072,-0.0389,0.038092,0.0054826,-0.018789,0.014394,0.012802,-0.055318,-0.0025825,-0.046007,0.00023837]],[[18,0.4142857,1,-15,0,0.951,2,-14,46,0.4642857,3,11,21,0.1525,4,-9,37,2.633333,5,8,6,57.5,6,-4,20,-1.69949,7,-3,0,0.7057778,-1,-2,0,0.8557778,-5,9,19,0.5916667,10,-8,12,0.2287579,-6,-7,21,0.0925,12,-13,24,-1.715112,-10,13,18,0.3666667,-11,-12],[-0.0067845,0.013008,0.031963,-0.043847,0.025633,0.019861,-0.058459,0.023437,-0.041307,0.011776,-0.06901,0.022142,0.015241,0.028121,-0.00011126]],[[18,0.4142857,1,-15,36,8.45,2,-14,24,-1.977875,3,6,24,-2.044173,4,-4,14,5771.0,5,-3,24,-2.677565,-1,-2,32,0.7673913,7,-13,24,-1.826607,-5,8,6,5.5,-6,9,2,19.5,10,11,19,0.3923077,-7,-8,6,27.5,12,13,38,3.1,-9,-10,26,0.16425,-11,-12],[0.020363,-0.049897,0.022711,-0.056652,0.027297,-0.034292,-0.026732,0.028043,-0.002612,-0.071025,-0.018916,0.018299,0.030138,-0.027458,-0.00012015]],[[18,0.4142857,-1,1,15,-6.745587,2,9,21,0.0425,-2,3,37,2.154762,4,8,35,4.633333,5,6,36,2.366667,-3,-4,19,0.5916667,7,-7,24,-1.490401,-5,-6,19,0.577381,-8,-9,16,0.3095238,10,-15,6,17.5,-10,11,30,21.83333,12,13,23,1.5,-11,-12,12,0.8755629,-13,-14],[0.006644,-0.025374,0.012555,-0.029352,0.036464,0.0011718,-0.039578,-0.039597,0.0075827,0.039875,0.026215,-0.05058,-0.027251,0.0262,1.839e-05]],[[18,0.4142857,-1,1,9,3.629933,-2,2,11,0.2614595,3,4,2,8.5,-3,-4,4,1971.5,5,10,34,147.375,6,-10,21,0.0125,-5,7,36,3.9,-6,8,23,5.5,9,-9,4,1532.5,-7,-8,34,166.5833,11,13,0,0.565,-11,12,5,7.5,-12,-13,4,8473.78,-14,-15],[0.0061295,-0.00035008,-0.027655,0.0025167,-0.015132,0.011608,-0.0027305,0.043405,0.053494,-0.018291,-0.010981,-0.0018535,0.019928,0.020281,-0.005778]],[[9,3.629933,-1,1,11,0.2614595,2,3,2,8.5,-2,-3,4,1971.5,4,10,37,0.45,5,8,35,5.9,6,7,6,1.5,-4,-5,4,1833.28,-6,-7,4,1702.575,-8,9,24,-1.374317,-9,-10,37,1.45,11,-15,43,0.2916667,12,-14,5,6.5,13,-13,35,8.9,-11,-12],[-0.00022765,-0.027256,0.0022514,0.024761,-0.0060827,0.050561,-0.0038672,-0.019975,0.00018977,0.051843,-0.019822,0.022559,0.01163,-0.021958,0.0082281]]]},
		//what getBuildFeatures gives the ranker for a set: the turn, then the search's view of the set and how the set is made up,
		//then the means over its ships of estimateOptionStats (getOptionStats)
		estimateRankerFeatures: ["fill", "shipLimit", "turn", "count", "target", "race", "fleetSeen", "freshSeen",
			"searchScore", "searchGap", "searchRank", "fitPenalty", "fitRatio", "fitMiss", "setValue", "setLogp",
			"distinctHulls", "distinctOptions", "topHullShare", "freshCovered", "minHullLogp", "minFocusShare", "maxHullRank", "maxHullTech"],
		estimateOptionStats: ["hullLogp", "outfitLogp", "focusShare", "inFocus", "outfitShare", "hullInFleet", "hullFleetCount", "hullFresh", "hullRank",
			"shipValue", "hullMass", "hullTech", "beams", "launchers", "bays", "engineTech", "bestEngine", "cheapEngine", "beamTech", "torpedoTech",
			"engineSeen", "beamSeen", "torpedoSeen", "scout", "sweeper", "utility", "fighter"],
		//the parts of the plugin the build estimate depends on: any change to them gives a new model version (getModelVersion)
		estimateModelParts: ["estimateResults", "estimateSearchWidth", "estimateMaxOver", "estimateRaceHullWeight", "estimateFreshWeight", "estimateFreshTurns",
			"estimateOpeningFill", "estimateEarlyFill", "startMilitary", "mineValue", "mineDecay", "estimatePhases", "estimateFitEdges", "estimateFitFloor",
			"estimateListed", "estimateConfidenceSpread", "estimateRanker", "estimateRankerFeatures", "estimateOptionStats", "estimateRaceFocus", "partValue", "shipModelValue", "isFreighterHull", "getBuildPhase",
			"getRaceFocus", "getBuildPriors", "estimateBuilds", "getOptionStats", "getBuildFeatures", "getRankerScore", "getShipRole", "getListedShare", "setConfidence", "getMineChange", "getFleetTorpedo",
			"getKnownShips", "getSeenTurns"],
		//how often the build estimate was right on complete games, from tools/report.js: model version and its hash
		//(getModelVersion, printed by report.js), and per phase the build turns tested and the percentage with the hulls and loadout among the listed
		//builds (loadout), the hulls in the top build (top1) and the hulls among the listed builds (listed)
		estimateAccuracy: {"version":4,"model":"3b963108","date":"2026-10-31","games":102,"phases":{"all":{"turns":19239,"loadout":22.6,"top1":54.9,"listed":76},"opening":{"turns":4971,"loadout":45.5,"top1":78.6,"listed":94.8},"early":{"turns":5335,"loadout":21.8,"top1":56.9,"listed":81.9},"nearCap":{"turns":8933,"loadout":10.4,"top1":40.5,"listed":62.1}}},
		//usual builds per race (by race id) and phase, from complete games: [hull id, share of builds,
		//[[engine id, beam id, torpedo id, share of the hull's builds], ...]], beam or torpedo id 0 when built without
		estimateRaceFocus: {
			1: {	//Federation
				opening: [[5,0.294,[[9,2,6,0.19],[9,3,6,0.1],[9,4,6,0.07]]],[8,0.183,[[7,2,0,0.14],[9,2,0,0.14],[1,1,0,0.13],[1,2,0,0.13]]],[3,0.171,[[1,1,0,0.15],[9,2,0,0.14],[1,2,0,0.11],[9,1,0,0.08]]],[7,0.138,[[9,2,6,0.1],[1,2,6,0.09],[9,4,6,0.07],[1,2,0,0.05]]],[9,0.109,[[9,2,0,0.5],[9,6,0,0.15],[9,4,0,0.09],[9,1,0,0.07]]],[12,0.031,[[1,2,0,0.38],[9,2,9,0.15],[1,2,6,0.15],[1,1,5,0.08]]],[13,0.015,[[9,6,6,0.17],[9,1,6,0.17],[1,1,2,0.17],[8,2,6,0.17]]],[19,0.015,[[1,2,0,0.33],[1,1,0,0.17],[9,2,0,0.17],[1,3,0,0.17]]],[2,0.014,[[9,3,2,0.17],[9,2,8,0.17],[9,2,6,0.17],[9,3,4,0.17]]]],
				early: [[3,0.155,[[1,1,0,0.17],[1,2,0,0.13],[9,2,0,0.13],[7,2,0,0.11]]],[8,0.14,[[1,1,0,0.31],[1,2,0,0.14],[9,2,0,0.13],[7,2,0,0.1]]],[13,0.12,[[1,2,0,0.22],[9,2,11,0.08],[1,1,1,0.08],[1,1,0,0.06]]],[5,0.118,[[1,1,1,0.09],[9,2,6,0.06],[9,3,9,0.06],[1,2,0,0.05]]],[7,0.115,[[1,2,6,0.08],[1,1,1,0.08],[1,2,0,0.08],[9,2,6,0.07]]],[105,0.089,[[1,2,0,0.41],[1,1,0,0.21],[1,3,0,0.12],[1,4,0,0.05]]],[12,0.071,[[1,1,1,0.22],[1,2,0,0.15],[9,2,9,0.09]]],[19,0.062,[[1,1,0,0.42],[9,2,0,0.2],[1,2,0,0.17],[9,1,0,0.1]]],[20,0.037,[[1,1,1,0.33],[1,2,0,0.12],[1,0,0,0.08],[1,1,0,0.08]]],[10,0.018,[[1,0,0,0.17],[9,7,6,0.08],[1,1,1,0.08],[9,2,9,0.08]]]],
				nearCap: [[13,0.17,[[1,2,0,0.12],[1,0,0,0.11],[1,1,1,0.09]]],[20,0.157,[[1,0,0,0.17],[1,1,1,0.16],[1,2,0,0.14]]],[7,0.104,[[1,2,0,0.11],[1,1,1,0.11],[1,0,0,0.07]]],[19,0.104,[[1,1,0,0.35],[1,2,0,0.23],[9,2,0,0.08],[9,1,0,0.06]]],[3,0.092,[[1,1,0,0.36],[1,2,0,0.22],[9,2,0,0.08]]],[8,0.075,[[1,1,0,0.31],[1,2,0,0.19],[5,2,0,0.05],[9,2,0,0.05]]],[12,0.071,[[1,1,1,0.19],[1,2,0,0.12],[1,0,0,0.08],[9,7,9,0.05]]],[5,0.056,[[1,1,1,0.12],[7,10,8,0.07],[1,1,0,0.05],[1,2,1,0.05]]],[105,0.055,[[1,1,0,0.44],[1,2,0,0.32],[1,3,0,0.1]]],[104,0.034,[[1,1,0,0.49],[1,2,0,0.33],[1,3,0,0.07],[1,6,0,0.07]]]]
			},
			2: {	//Lizard
				opening: [[22,0.418,[[9,2,6,0.36],[9,6,6,0.17],[9,2,4,0.08],[9,3,6,0.06]]],[8,0.269,[[1,1,0,0.27],[1,2,0,0.18],[5,2,0,0.1],[6,2,0,0.07]]],[24,0.173,[[1,1,0,0.24],[1,2,0,0.16],[9,2,0,0.14],[4,1,0,0.06]]],[21,0.084,[[9,2,0,0.38],[9,6,0,0.07],[7,2,0,0.07],[5,2,0,0.05]]],[7,0.044,[[9,2,6,0.21],[1,1,1,0.14],[9,1,7,0.1],[9,6,6,0.07]]]],
				early: [[22,0.283,[[9,2,6,0.16],[9,6,6,0.12],[9,6,9,0.12],[9,2,9,0.07]]],[8,0.252,[[1,1,0,0.34],[1,2,0,0.14],[5,2,0,0.08],[5,1,0,0.07]]],[24,0.147,[[1,1,0,0.3],[1,2,0,0.17],[9,2,0,0.09],[7,1,0,0.06]]],[23,0.097,[[9,6,9,0.23],[9,6,10,0.16],[9,3,9,0.09],[9,7,9,0.08]]],[7,0.093,[[9,6,6,0.09],[1,2,1,0.08],[5,2,6,0.08],[7,2,6,0.06]]],[21,0.048,[[9,2,0,0.12],[9,3,0,0.11],[9,4,0,0.07],[1,4,0,0.07]]],[105,0.044,[[1,2,0,0.35],[1,1,0,0.21],[1,3,0,0.13],[1,6,0,0.12]]],[49,0.017,[[9,2,0,0.35],[9,6,0,0.25],[1,2,0,0.15],[9,3,0,0.1]]]],
				nearCap: [[23,0.266,[[9,6,10,0.16],[9,10,10,0.14],[9,6,9,0.14],[9,7,10,0.12]]],[22,0.219,[[9,6,9,0.15],[9,6,6,0.09],[9,2,6,0.06]]],[8,0.155,[[1,1,0,0.42],[1,2,0,0.17],[1,3,0,0.06],[5,2,0,0.06]]],[24,0.091,[[1,2,0,0.33],[1,1,0,0.32],[9,2,0,0.05]]],[7,0.083,[[9,2,6,0.09],[9,6,6,0.06],[9,6,9,0.06]]],[49,0.075,[[9,6,0,0.16],[9,7,0,0.13],[9,10,0,0.12],[9,2,0,0.11]]],[21,0.035,[[9,2,0,0.15],[7,2,0,0.11],[9,3,0,0.09],[9,6,0,0.06]]],[105,0.034,[[1,2,0,0.3],[1,1,0,0.27],[1,3,0,0.11]]],[104,0.016,[[1,1,0,0.33],[1,2,0,0.26],[1,6,0,0.07]]]]
			},
			3: {	//Bird Men
				opening: [[27,0.449,[[9,2,0,0.56],[9,6,0,0.12],[9,3,0,0.11]]],[31,0.261,[[9,2,6,0.36],[9,6,6,0.11],[9,2,4,0.07],[9,3,6,0.07]]],[28,0.094,[[9,2,6,0.34],[9,6,6,0.2],[9,2,4,0.11],[9,3,6,0.07]]],[106,0.054,[[7,2,6,0.12],[1,2,6,0.12],[6,2,1,0.08],[9,2,1,0.08]]],[26,0.052,[[9,6,6,0.25],[9,2,1,0.21],[9,2,6,0.12],[9,3,9,0.08]]],[32,0.032,[[9,1,0,0.4],[9,2,6,0.13],[2,2,6,0.13],[9,6,6,0.07]]],[33,0.026,[[9,2,9,0.25],[9,2,6,0.17],[9,6,6,0.17],[9,3,9,0.17]]],[29,0.01,[[7,1,6,0.25],[9,2,6,0.25],[9,2,4,0.25],[9,3,6,0.25]]]],
				early: [[31,0.299,[[9,2,6,0.23],[9,6,9,0.13],[9,2,9,0.08],[9,6,6,0.08]]],[27,0.267,[[9,2,0,0.35],[9,6,0,0.16],[9,3,0,0.1],[9,4,0,0.08]]],[29,0.139,[[9,6,9,0.14],[9,2,9,0.12],[9,3,9,0.12],[9,2,4,0.07]]],[106,0.093,[[1,2,1,0.13],[9,2,6,0.09],[9,3,6,0.07],[9,1,6,0.06]]],[105,0.064,[[1,2,0,0.41],[1,1,0,0.3],[1,3,0,0.08],[1,6,0,0.05]]],[28,0.036,[[9,6,6,0.19],[9,2,6,0.14],[9,4,6,0.1],[9,7,6,0.1]]],[26,0.033,[[9,2,5,0.21],[9,2,6,0.16],[9,3,9,0.16],[9,2,4,0.16]]],[33,0.029,[[9,2,6,0.18],[9,8,9,0.12],[9,3,9,0.12],[9,2,9,0.12]]],[32,0.019,[[2,2,7,0.36],[9,1,0,0.18],[8,7,1,0.09],[5,7,7,0.09]]]],
				nearCap: [[29,0.363,[[9,6,9,0.2],[9,6,10,0.12],[9,2,9,0.11],[9,10,10,0.08]]],[31,0.27,[[9,6,9,0.23],[9,2,9,0.12],[9,2,6,0.09],[9,3,9,0.05]]],[27,0.131,[[9,2,0,0.42],[9,6,0,0.19],[9,3,0,0.1]]],[106,0.059,[[7,2,1,0.18],[1,1,1,0.09],[9,3,6,0.08],[1,2,6,0.08]]],[105,0.044,[[1,1,0,0.29],[1,2,0,0.22],[1,3,0,0.12],[5,3,0,0.05]]],[26,0.032,[[9,2,6,0.14],[9,6,9,0.12]]],[28,0.027,[[9,6,6,0.19],[7,6,6,0.14],[9,2,6,0.08],[9,2,9,0.08]]],[104,0.024,[[1,1,0,0.28],[1,2,0,0.25],[1,3,0,0.12],[7,2,0,0.06]]],[33,0.018,[[9,10,10,0.13],[9,7,6,0.13],[9,3,6,0.09],[9,2,9,0.09]]],[32,0.011,[[9,2,6,0.21],[9,6,10,0.07],[9,6,6,0.07],[9,9,6,0.07]]]]
			},
			4: {	//Fascist
				opening: [[36,0.454,[[9,2,6,0.42],[9,6,6,0.07],[9,3,6,0.07]]],[39,0.245,[[1,2,0,0.26],[1,1,0,0.23],[7,2,0,0.09],[9,2,0,0.05]]],[33,0.064,[[9,2,6,0.47],[9,6,6,0.13],[9,2,9,0.07],[7,2,0,0.07]]],[37,0.058,[[9,2,6,0.37],[9,2,9,0.11],[9,6,6,0.07],[9,3,6,0.07]]],[59,0.036,[[9,3,0,0.53],[9,2,0,0.24],[9,1,0,0.18],[9,6,0,0.06]]],[2034,0.034,[[9,2,0,0.69],[9,1,0,0.12],[8,2,0,0.12],[9,6,0,0.06]]],[107,0.026,[[9,2,0,0.25],[1,6,0,0.17],[1,1,0,0.08],[9,6,0,0.08]]],[1039,0.022,[[1,1,0,0.8],[7,1,0,0.2]]],[40,0.013,[[9,6,0,0.33],[8,6,0,0.33],[6,1,0,0.17],[6,6,0,0.17]]],[2038,0.011,[[9,2,6,0.6],[9,4,6,0.4]]]],
				early: [[39,0.304,[[1,2,0,0.37],[1,1,0,0.19],[5,2,0,0.09],[7,2,0,0.07]]],[36,0.252,[[9,2,6,0.25],[9,6,9,0.08],[9,6,6,0.08],[9,3,6,0.07]]],[35,0.114,[[9,6,9,0.26],[9,2,6,0.09],[9,2,9,0.08],[9,3,10,0.07]]],[37,0.096,[[9,6,9,0.2],[9,2,6,0.16],[9,2,9,0.16],[9,3,6,0.09]]],[105,0.067,[[1,2,0,0.51],[1,3,0,0.22],[1,1,0,0.18]]],[1039,0.033,[[9,1,0,0.5],[1,1,0,0.23],[5,1,0,0.14],[5,2,0,0.09]]],[33,0.032,[[9,2,6,0.19],[9,2,9,0.1],[9,7,9,0.1],[9,6,9,0.1]]],[59,0.019,[[1,2,0,0.31],[9,2,0,0.23],[9,3,0,0.23],[9,6,0,0.15]]],[2034,0.016,[[9,2,0,0.27],[9,1,0,0.18],[9,5,0,0.09],[9,4,0,0.09]]],[41,0.011,[[1,1,0,0.71],[1,2,0,0.29]]]],
				nearCap: [[39,0.292,[[1,2,0,0.31],[1,1,0,0.15],[7,2,0,0.1],[9,2,0,0.09]]],[35,0.282,[[9,6,9,0.2],[9,10,10,0.1],[9,7,9,0.09],[9,6,10,0.09]]],[36,0.144,[[9,6,9,0.22],[9,2,6,0.15],[9,2,9,0.09],[9,6,10,0.09]]],[37,0.074,[[9,7,9,0.13],[9,6,9,0.12],[9,2,6,0.06]]],[1039,0.041,[[9,1,0,0.36],[1,1,0,0.22],[7,1,0,0.06],[1,2,0,0.05]]],[33,0.033,[[9,2,6,0.11],[9,6,9,0.11],[9,6,6,0.08],[9,2,9,0.06]]],[105,0.031,[[1,2,0,0.4],[1,1,0,0.2],[1,3,0,0.08],[7,2,0,0.05]]],[104,0.022,[[1,2,0,0.21],[1,1,0,0.19],[1,6,0,0.1],[1,3,0,0.07]]],[41,0.019,[[1,1,0,0.24],[9,2,0,0.14],[9,3,0,0.11],[7,2,0,0.08]]],[1041,0.014,[[9,6,0,0.3],[9,1,0,0.22],[9,3,0,0.15],[9,2,0,0.11]]]]
			},
			5: {	//Privateer
				opening: [[46,0.67,[[9,2,6,0.36],[9,6,6,0.1],[9,2,0,0.07],[9,2,2,0.06]]],[42,0.142,[[1,2,6,0.26],[1,2,1,0.17],[1,1,1,0.16],[5,2,4,0.07]]],[44,0.129,[[7,2,0,0.39],[9,2,0,0.35],[8,2,0,0.06],[9,6,0,0.06]]],[45,0.034,[[9,2,0,0.17],[9,2,6,0.17],[7,6,7,0.11],[9,5,5,0.06]]]],
				early: [[46,0.609,[[9,2,6,0.24],[9,6,6,0.17],[9,2,0,0.07],[9,6,9,0.05]]],[42,0.132,[[1,1,1,0.2],[1,2,1,0.14],[1,2,0,0.14],[1,2,6,0.11]]],[44,0.118,[[9,2,0,0.44],[7,2,0,0.25],[9,6,0,0.07],[6,2,0,0.06]]],[105,0.056,[[1,2,0,0.63],[1,1,0,0.17],[1,6,0,0.1],[1,3,0,0.07]]],[45,0.042,[[7,2,1,0.16],[7,2,2,0.13],[7,2,0,0.1],[9,2,2,0.1]]],[1,0.014,[[1,1,0,0.8],[9,4,0,0.1],[7,2,0,0.1]]]],
				nearCap: [[46,0.612,[[9,6,6,0.13],[9,2,6,0.12],[9,6,9,0.11],[9,2,9,0.05]]],[44,0.105,[[9,2,0,0.18],[1,2,0,0.17],[7,2,0,0.14],[5,2,0,0.09]]],[42,0.097,[[1,1,1,0.23],[1,2,6,0.12],[1,2,1,0.08],[1,1,7,0.05]]],[105,0.047,[[1,2,0,0.3],[1,1,0,0.21]]],[45,0.031,[[7,2,0,0.14]]],[50,0.029,[[9,6,0,0.22],[9,9,0,0.13],[9,10,0,0.12],[9,8,0,0.08]]],[43,0.015,[[9,10,0,0.22],[9,6,0,0.16],[7,6,0,0.09],[9,9,0,0.09]]],[104,0.015,[[1,2,0,0.31],[1,6,0,0.12],[1,1,0,0.09],[9,9,0,0.06]]],[2050,0.012,[[9,6,0,0.42],[9,10,0,0.42],[9,2,0,0.12]]]]
			},
			6: {	//Cyborg
				opening: [[51,0.51,[[9,2,0,0.21],[9,6,0,0.1],[7,2,0,0.08],[5,2,0,0.06]]],[56,0.368,[[9,2,6,0.22],[9,3,6,0.1],[9,6,6,0.09],[9,1,6,0.07]]],[1054,0.035,[[9,2,0,0.43],[7,6,0,0.14],[3,1,0,0.14],[9,6,0,0.1]]],[1058,0.027,[[9,2,6,0.25],[9,6,6,0.19],[5,2,5,0.12],[9,2,5,0.06]]],[1055,0.017,[[9,2,0,0.4],[6,3,0,0.2],[7,3,0,0.1],[9,4,0,0.1]]],[54,0.015,[[9,2,0,0.44],[9,3,0,0.33],[9,6,0,0.11],[9,1,0,0.11]]]],
				early: [[56,0.435,[[9,2,6,0.11],[9,3,6,0.08],[9,2,9,0.05]]],[51,0.268,[[9,2,0,0.11],[9,6,0,0.09],[5,2,0,0.08],[7,2,0,0.07]]],[52,0.066,[[1,2,0,0.14],[9,6,0,0.14],[9,2,0,0.14]]],[105,0.042,[[1,2,0,0.43],[1,1,0,0.14],[1,3,0,0.07]]],[1058,0.036,[[9,4,9,0.21],[1,1,1,0.12],[5,2,5,0.12],[7,2,6,0.08]]],[1054,0.035,[[9,2,0,0.13],[1,3,0,0.13],[1,1,0,0.09],[3,3,0,0.09]]],[53,0.026,[[9,6,9,0.12],[9,7,9,0.12],[5,2,6,0.06],[9,9,8,0.06]]],[1057,0.023,[[3,3,0,0.27],[1,3,0,0.2],[1,2,0,0.13],[9,5,0,0.07]]],[54,0.021,[[9,6,0,0.29],[1,1,0,0.21],[7,2,0,0.21],[9,1,0,0.14]]],[55,0.012,[[9,5,0,0.38],[9,3,0,0.12],[9,2,0,0.12],[6,5,0,0.12]]]],
				nearCap: [[56,0.43,[[9,2,6,0.07],[9,6,9,0.07]]],[52,0.257,[[9,6,0,0.19],[9,10,0,0.12],[9,7,0,0.09],[1,2,0,0.07]]],[51,0.082,[[1,2,0,0.13],[1,1,0,0.11],[9,2,0,0.08],[2,2,0,0.07]]],[53,0.053,[[9,6,9,0.18],[9,6,10,0.11],[9,6,6,0.06]]],[1054,0.042,[[9,2,0,0.14],[1,1,0,0.14],[1,2,0,0.14],[2,3,0,0.09]]],[105,0.04,[[1,2,0,0.36],[1,1,0,0.13],[1,4,0,0.08],[5,6,0,0.06]]],[1058,0.031,[[7,2,1,0.07],[9,2,7,0.07],[9,2,6,0.07]]],[1057,0.016,[[1,1,0,0.18],[3,3,0,0.14],[4,3,0,0.14],[4,4,0,0.14]]],[55,0.012,[[1,1,0,0.25],[1,3,0,0.12],[1,6,0,0.12],[1,2,0,0.06]]]]
			},
			7: {	//Crystal
				opening: [[60,0.428,[[9,2,6,0.39],[9,2,9,0.16],[9,3,6,0.06]]],[61,0.207,[[9,2,6,0.42],[9,2,9,0.17],[9,3,6,0.08]]],[66,0.194,[[9,2,6,0.34],[9,2,9,0.15],[7,2,6,0.07],[9,1,6,0.06]]],[64,0.069,[[9,2,9,0.1],[1,2,6,0.1],[1,1,1,0.1],[1,3,6,0.07]]],[110,0.032,[[8,6,8,0.29],[9,2,6,0.14],[9,2,9,0.07],[7,1,9,0.07]]],[65,0.016,[[1,2,0,0.57],[9,6,0,0.14],[6,1,0,0.14],[9,1,0,0.14]]],[59,0.014,[[9,4,0,0.33],[9,3,0,0.17],[1,3,0,0.17],[1,2,0,0.17]]]],
				early: [[61,0.27,[[9,2,9,0.2],[9,6,9,0.12],[9,3,9,0.11],[9,2,6,0.11]]],[60,0.266,[[9,2,9,0.26],[9,2,6,0.2],[9,2,10,0.06]]],[66,0.143,[[9,2,9,0.17],[9,3,9,0.09],[9,2,6,0.09]]],[64,0.1,[[1,1,1,0.1],[1,1,6,0.1],[1,2,9,0.07],[9,2,9,0.07]]],[63,0.058,[[9,6,9,0.26],[9,2,9,0.14],[9,6,10,0.11],[9,3,9,0.06]]],[105,0.048,[[1,2,0,0.31],[5,3,0,0.14],[6,6,0,0.07],[1,6,0,0.07]]],[67,0.028,[[1,2,0,0.35],[9,2,0,0.12],[7,6,0,0.06],[8,7,0,0.06]]],[65,0.015,[[1,2,0,0.44],[1,3,0,0.11],[1,10,0,0.11],[9,6,0,0.11]]],[2065,0.015,[[9,6,0,0.22],[9,2,0,0.22],[8,6,0,0.22],[6,1,0,0.11]]],[59,0.011,[[1,2,0,1.0]]]],
				nearCap: [[61,0.249,[[9,6,9,0.19],[9,2,9,0.14],[9,6,10,0.11]]],[60,0.2,[[9,2,9,0.18],[9,3,9,0.12],[9,2,6,0.1],[9,6,9,0.06]]],[63,0.166,[[9,6,9,0.19],[9,6,10,0.16],[9,2,9,0.09],[9,7,9,0.06]]],[66,0.082,[[9,2,9,0.12],[9,2,6,0.12],[9,6,9,0.07],[7,3,9,0.06]]],[64,0.077,[[9,2,9,0.11],[1,1,1,0.1],[1,2,9,0.08],[1,2,1,0.07]]],[67,0.071,[[9,6,0,0.2],[7,2,0,0.11],[9,2,0,0.08],[1,2,0,0.08]]],[105,0.055,[[1,2,0,0.41],[1,1,0,0.16],[1,3,0,0.09],[5,3,0,0.07]]],[104,0.028,[[1,2,0,0.31],[1,1,0,0.17],[1,3,0,0.07],[6,6,0,0.07]]],[65,0.016,[[9,3,0,0.17],[1,2,0,0.17],[2,2,0,0.12],[9,4,0,0.12]]],[62,0.016,[[5,10,6,0.12],[4,2,9,0.08],[7,10,6,0.08],[5,9,6,0.08]]]]
			},
			8: {	//Evil Empire
				opening: [[77,0.601,[[9,2,0,0.13],[5,2,0,0.13],[7,2,0,0.12],[1,2,0,0.1]]],[69,0.15,[[9,2,0,0.4],[9,6,0,0.17],[9,3,0,0.12],[9,4,0,0.11]]],[75,0.067,[[9,2,6,0.24],[9,3,6,0.07],[1,2,9,0.07],[9,1,6,0.07]]],[2076,0.055,[[9,2,0,0.33],[9,7,0,0.21],[9,3,0,0.08],[9,4,0,0.08]]],[76,0.046,[[9,2,0,0.35],[9,6,0,0.15],[9,3,0,0.1],[9,4,0,0.1]]],[68,0.018,[[9,2,0,0.5],[9,4,0,0.12],[7,7,0,0.12],[6,2,0,0.12]]],[72,0.014,[[9,4,0,0.33],[9,2,0,0.33],[8,1,0,0.17],[7,2,0,0.17]]],[105,0.012,[[1,2,0,0.4],[1,1,0,0.2],[1,3,0,0.2],[5,6,0,0.2]]],[1073,0.012,[[9,2,0,0.4],[9,8,0,0.2],[9,9,0,0.2],[8,1,0,0.2]]]],
				early: [[77,0.363,[[1,2,0,0.12],[9,2,0,0.12],[6,2,0,0.11],[7,2,0,0.09]]],[69,0.146,[[9,2,0,0.27],[9,6,0,0.21],[9,3,0,0.14],[9,7,0,0.08]]],[70,0.114,[[9,6,0,0.17],[1,2,0,0.17],[5,6,0,0.1],[9,2,0,0.07]]],[75,0.089,[[9,2,6,0.15],[9,2,9,0.11],[9,5,6,0.06]]],[105,0.083,[[1,2,0,0.41],[1,1,0,0.23],[1,3,0,0.11]]],[76,0.034,[[9,6,0,0.44],[9,2,0,0.28],[9,3,0,0.11],[8,2,0,0.06]]],[72,0.032,[[9,2,0,0.35],[9,3,0,0.24],[1,2,0,0.18],[8,2,0,0.06]]],[2076,0.03,[[9,2,0,0.19],[9,6,0,0.19],[9,3,0,0.19],[9,9,0,0.06]]],[74,0.021,[[9,6,0,0.36],[9,8,0,0.18],[9,3,0,0.09],[9,5,0,0.09]]],[68,0.019,[[9,3,0,0.3],[9,2,0,0.2],[9,7,0,0.2],[7,8,0,0.1]]]],
				nearCap: [[70,0.35,[[9,6,0,0.16],[9,7,0,0.07],[5,6,0,0.06],[7,6,0,0.06]]],[69,0.154,[[9,6,0,0.27],[9,2,0,0.21],[9,3,0,0.14],[9,7,0,0.07]]],[77,0.122,[[1,2,0,0.15],[9,6,0,0.1],[5,2,0,0.08],[1,1,0,0.08]]],[75,0.09,[[9,6,9,0.17],[9,2,9,0.07],[9,4,9,0.06],[9,2,6,0.06]]],[105,0.06,[[1,2,0,0.44],[1,1,0,0.13],[1,6,0,0.09],[1,3,0,0.07]]],[74,0.038,[[9,6,0,0.37],[9,2,0,0.21],[9,7,0,0.09],[9,3,0,0.09]]],[104,0.031,[[1,2,0,0.51],[1,1,0,0.14],[1,6,0,0.06],[5,6,0,0.06]]],[1074,0.026,[[9,6,0,0.27],[9,3,0,0.2],[9,4,0,0.17],[9,7,0,0.1]]],[72,0.022,[[9,2,0,0.36],[1,2,0,0.2],[6,2,0,0.12],[9,4,0,0.08]]],[68,0.019,[[9,2,0,0.29],[9,3,0,0.19],[9,6,0,0.19],[9,9,0,0.1]]]]
			},
			9: {	//Robot
				opening: [[81,0.594,[[9,2,6,0.4],[9,2,9,0.11],[9,1,6,0.08],[9,3,6,0.06]]],[82,0.244,[[1,0,0,0.45],[9,0,0,0.35],[5,0,0,0.06],[6,0,0,0.05]]],[84,0.058,[[9,2,0,0.25],[1,1,0,0.21],[7,2,0,0.17],[1,2,0,0.12]]],[78,0.032,[[9,2,0,0.38],[7,2,0,0.15],[1,3,0,0.15],[5,2,0,0.08]]],[2083,0.02,[[7,2,0,0.25],[5,2,0,0.25],[5,4,0,0.25],[9,3,0,0.12]]],[85,0.019,[[9,6,0,0.25],[9,2,0,0.25],[9,4,0,0.12],[9,3,0,0.12]]]],
				early: [[81,0.325,[[9,2,9,0.17],[9,2,6,0.16],[9,3,6,0.07]]],[82,0.254,[[1,0,0,0.33],[9,0,0,0.31],[7,0,0,0.1],[6,0,0,0.1]]],[79,0.1,[[9,2,0,0.1],[5,3,0,0.1],[1,2,0,0.09],[5,2,0,0.07]]],[80,0.095,[[9,2,0,0.2],[5,2,0,0.18],[1,1,0,0.09],[5,3,0,0.07]]],[78,0.083,[[9,2,0,0.33],[9,6,0,0.1],[1,2,0,0.1],[9,3,0,0.08]]],[105,0.06,[[1,1,0,0.34],[1,2,0,0.29],[1,3,0,0.09],[7,6,0,0.06]]],[2083,0.041,[[7,2,0,0.21],[6,2,0,0.21],[9,2,0,0.12],[9,3,0,0.08]]],[85,0.017,[[1,1,0,0.3],[1,2,0,0.2],[9,3,0,0.2],[5,2,0,0.1]]],[104,0.012,[[1,5,0,0.14],[5,4,0,0.14],[1,4,0,0.14],[5,1,0,0.14]]]],
				nearCap: [[79,0.32,[[9,6,0,0.09],[9,7,0,0.08],[5,2,0,0.07],[9,2,0,0.07]]],[81,0.202,[[9,2,9,0.15],[9,2,10,0.08],[9,6,10,0.08],[9,2,6,0.05]]],[82,0.14,[[1,0,0,0.35],[9,0,0,0.33],[6,0,0,0.11],[5,0,0,0.07]]],[80,0.127,[[1,2,0,0.12],[9,6,0,0.11],[5,2,0,0.08],[1,1,0,0.08]]],[78,0.105,[[9,2,0,0.17],[9,6,0,0.15],[1,2,0,0.12],[9,3,0,0.09]]],[105,0.033,[[1,2,0,0.47],[1,1,0,0.18],[5,3,0,0.06],[1,3,0,0.06]]],[2083,0.027,[[9,3,0,0.15],[6,2,0,0.12],[1,2,0,0.12],[4,2,0,0.1]]],[104,0.027,[[1,2,0,0.41],[1,1,0,0.22],[2,2,0,0.07]]]]
			},
			10: {	//Rebel
				opening: [[87,0.654,[[9,2,0,0.17],[9,6,0,0.14],[7,2,0,0.1],[7,6,0,0.1]]],[101,0.09,[[9,2,0,0.36],[9,6,0,0.11],[9,3,0,0.08],[9,4,0,0.08]]],[86,0.055,[[9,6,6,0.28],[9,1,6,0.12],[9,2,6,0.09],[7,2,6,0.06]]],[91,0.046,[[9,3,0,0.26],[9,2,0,0.22],[9,5,0,0.19],[6,6,0,0.07]]],[92,0.043,[[9,2,0,0.2],[9,4,0,0.2],[9,1,0,0.12],[9,6,0,0.12]]],[94,0.022,[[1,2,0,0.25],[5,2,0,0.17],[1,6,0,0.17],[6,2,0,0.08]]],[103,0.019,[[6,2,6,0.09],[9,7,6,0.09],[7,6,9,0.09],[9,1,6,0.09]]],[100,0.019,[[1,2,0,0.18],[9,5,0,0.18],[9,4,0,0.18],[9,6,0,0.18]]],[1087,0.014,[[5,2,0,0.5],[9,3,0,0.25],[9,2,0,0.25]]],[1093,0.014,[[9,2,0,0.25],[9,6,0,0.25],[7,2,0,0.12],[9,3,0,0.12]]]],
				early: [[87,0.433,[[9,6,0,0.09],[9,2,0,0.09],[5,2,0,0.08],[6,2,0,0.07]]],[94,0.135,[[9,6,0,0.12],[1,2,0,0.12],[5,2,0,0.12],[9,7,0,0.08]]],[86,0.09,[[9,2,9,0.13],[9,6,6,0.12],[9,5,6,0.09],[9,2,6,0.06]]],[92,0.083,[[9,2,0,0.17],[9,6,0,0.16],[9,5,0,0.14],[9,4,0,0.11]]],[101,0.082,[[9,2,0,0.19],[9,6,0,0.19],[1,2,0,0.13],[9,3,0,0.08]]],[105,0.046,[[1,2,0,0.29],[1,3,0,0.11],[1,1,0,0.11],[1,6,0,0.06]]],[91,0.03,[[9,2,0,0.35],[9,6,0,0.3],[9,7,0,0.09],[9,3,0,0.09]]],[103,0.024,[[9,1,6,0.11],[5,1,7,0.11],[9,2,8,0.11],[9,4,6,0.06]]],[100,0.024,[[9,2,0,0.28],[9,6,0,0.22],[1,1,0,0.11],[9,7,0,0.06]]],[88,0.011,[[9,6,6,0.25],[7,2,8,0.25],[6,2,8,0.12],[9,2,6,0.12]]]],
				nearCap: [[94,0.355,[[9,6,0,0.15],[9,7,0,0.09],[1,2,0,0.07],[5,2,0,0.07]]],[87,0.264,[[9,6,0,0.09],[5,2,0,0.06],[6,2,0,0.06],[9,2,0,0.06]]],[86,0.075,[[9,6,9,0.17],[9,7,9,0.09],[9,6,6,0.07],[9,6,10,0.07]]],[101,0.067,[[1,2,0,0.18],[9,6,0,0.13],[9,2,0,0.1],[9,3,0,0.09]]],[92,0.063,[[9,6,0,0.27],[9,4,0,0.11],[9,2,0,0.09],[9,7,0,0.07]]],[105,0.035,[[1,2,0,0.39],[1,1,0,0.2],[1,6,0,0.17],[1,3,0,0.07]]],[103,0.02,[[1,2,10,0.16],[6,4,6,0.16],[9,8,6,0.06],[7,2,6,0.06]]],[104,0.02,[[1,1,0,0.39],[1,2,0,0.29],[1,6,0,0.06],[5,2,0,0.06]]],[89,0.02,[[9,10,10,0.16],[9,10,9,0.1],[9,8,10,0.1],[9,6,9,0.06]]],[100,0.019,[[1,2,0,0.24],[1,1,0,0.24],[9,2,0,0.17],[7,1,0,0.07]]]]
			},
			11: {	//Colonies
				opening: [[96,0.52,[[9,2,6,0.5],[9,6,6,0.1],[9,1,6,0.06],[9,3,6,0.05]]],[101,0.164,[[9,2,0,0.18],[9,6,0,0.18],[1,2,0,0.13],[9,3,0,0.11]]],[42,0.139,[[1,1,1,0.22],[1,2,6,0.1],[1,2,1,0.09],[1,6,6,0.06]]],[92,0.079,[[9,2,0,0.55],[9,6,0,0.13],[9,4,0,0.11],[9,7,0,0.05]]],[100,0.029,[[1,2,0,0.21],[9,2,0,0.14],[9,4,0,0.14],[5,2,0,0.07]]],[99,0.023,[[1,2,0,0.3],[5,2,0,0.2],[5,3,0,0.1],[1,3,0,0.1]]],[103,0.017,[[9,2,6,0.25],[6,6,4,0.25],[7,2,5,0.25],[6,1,6,0.12]]],[86,0.012,[[9,6,6,0.17],[9,2,9,0.17],[9,2,6,0.17],[8,3,8,0.17]]]],
				early: [[96,0.298,[[9,2,6,0.28],[9,2,9,0.13],[9,6,6,0.1]]],[99,0.187,[[1,2,0,0.27],[5,2,0,0.11],[9,2,0,0.1],[5,3,0,0.06]]],[42,0.131,[[1,1,1,0.25],[1,2,6,0.17],[1,1,6,0.09]]],[92,0.124,[[9,2,0,0.43],[9,6,0,0.19],[9,1,0,0.08],[9,7,0,0.08]]],[101,0.095,[[9,2,0,0.36],[1,2,0,0.15],[9,6,0,0.1],[1,1,0,0.08]]],[105,0.055,[[1,2,0,0.53],[1,1,0,0.18],[1,6,0,0.09]]],[103,0.04,[[9,2,8,0.08],[5,2,10,0.08],[9,1,6,0.08],[1,2,6,0.08]]],[100,0.021,[[9,3,0,0.15],[9,4,0,0.15],[1,2,0,0.15],[9,6,0,0.08]]],[1102,0.013,[[9,7,0,0.5],[9,4,0,0.12],[9,6,0,0.12],[6,2,0,0.12]]],[86,0.013,[[9,6,9,0.25],[6,4,6,0.25],[9,5,6,0.12],[9,3,10,0.12]]]],
				nearCap: [[99,0.431,[[1,2,0,0.14],[9,2,0,0.1],[9,6,0,0.09],[9,7,0,0.07]]],[96,0.235,[[9,2,6,0.18],[9,2,9,0.12],[9,6,9,0.09],[9,1,6,0.06]]],[42,0.077,[[1,1,1,0.34],[1,2,6,0.12],[6,1,1,0.07]]],[101,0.065,[[9,2,0,0.26],[1,2,0,0.23],[9,6,0,0.08]]],[92,0.064,[[9,2,0,0.4],[9,6,0,0.22],[9,3,0,0.08],[7,2,0,0.08]]],[105,0.043,[[1,2,0,0.36],[1,1,0,0.17],[1,3,0,0.08],[5,4,0,0.06]]],[103,0.026,[[1,2,6,0.21],[1,2,10,0.12],[6,7,6,0.07]]],[100,0.014,[[1,2,0,0.39],[9,6,0,0.13]]]]
			}
		},
		manualBuild: null,		//last choices in the manual build calculator
		manualTarget: null,		//military score change the manual build is compared to
		manualTurn: null,		//build turn the manual build can be stored as the predicted build of

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
			this.predictedShips = [];
			this.scoreHistory = {};
			this.mineHistory = {};
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

				var stored_scores = localStorage.getItem(this.storage_path + "scorehistory");
				this.scoreHistory = (stored_scores != null) ? JSON.parse(stored_scores) : {};
				var stored_mines = localStorage.getItem(this.storage_path + "minehistory");
				this.mineHistory = (stored_mines != null) ? JSON.parse(stored_mines) : {};
				var stored_predicted = localStorage.getItem(this.storage_path + "predicted");
				this.predictedShips = (stored_predicted != null) ? JSON.parse(stored_predicted) : [];

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
			localStorage.removeItem(key_prefix + "scorehistory");
			localStorage.removeItem(key_prefix + "minehistory");
			localStorage.removeItem(key_prefix + "predicted");

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

			//the scoreboard of any loaded turn is valid on its own, so record it even if the list is not updated
			this.recordScores();
			this.recordMinefields();

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
					var oldPredictedLoadout = null;
					//loop through list of enemy ships and delete ship with same id
					for (var es = 0; es < this.enemyShipList.length; es++) {
						if (this.enemyShipList[es].id == ship.objectid) {
							//remove ship
							deletedData = this.enemyShipList.splice(es, 1);
							//ids are reused once a ship is destroyed; a ship never changes hull, so another hull is a new ship
							if (deletedData && deletedData.length > 0 && deletedData[0].hullid == ship.hullid) {
								oldShipHistory = deletedData[0].history;
								oldPredictedLoadout = deletedData[0].predictedLoadout;
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
					if (oldPredictedLoadout && !this.isSharedPlayer(n.ownerid)) {
						n.predictedLoadout = oldPredictedLoadout;
						n.predictedLoadout.fields = this.predictedLoadoutFields(n, oldPredictedLoadout.fields);
						this.applyLoadoutFields(n, n.predictedLoadout.fields);
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
				if (this.isSharedPlayer(ownerid)) {
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
				var oldPredictedLoadout = null;
				//loop through list of enemy ships and delete ship with same id
				for (var es = 0; es < this.enemyShipList.length; es++) {
					if (this.enemyShipList[es].id == vgap.ships[i].id) {
						//remove ship
						deletedData = this.enemyShipList.splice(es, 1);
						//ids are reused once a ship is destroyed; a ship never changes hull, so another hull is a new ship
						if (deletedData && deletedData.length > 0 && deletedData[0].hullid == vgap.ships[i].hullid) {
							oldShipHistory = deletedData[0].history;
							oldPredictedLoadout = deletedData[0].predictedLoadout;
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
				//a loadout merged from a predicted build fills in what this sighting still does not show
				if (oldPredictedLoadout && !this.isSharedPlayer(n.ownerid)) {
					n.predictedLoadout = oldPredictedLoadout;
					n.predictedLoadout.fields = this.predictedLoadoutFields(n, oldPredictedLoadout.fields);
					this.applyLoadoutFields(n, n.predictedLoadout.fields);
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
			this.reconcilePredictions();

		},

		/**
		 * Check if a player's ships are all seen every turn: the player themselves, a full ally or a player sharing intel
		 * @param ownerid	player id
		 * @return 			true if the player's builds need no prediction
		 */
		isSharedPlayer: function (ownerid) {
			var relation = vgap.getRelation(ownerid);
			return ownerid == vgap.player.id || vgap.fullallied(ownerid) || (relation != null && relation.relationfrom >= 3);
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
				//predicted builds count like ships in the list
				var predictedCounts = vgap.plugins["enemyShipListPlugin"].countPredicted(player.id);
				capitalships_in_list += predictedCounts.capitals;
				freighters_in_list += predictedCounts.freighters;
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
			$("<li " + (view == 8 ? "class='SelectedFilter'" : "") + ">Build Predictor</li>").tclick(function () { vgap.plugins["enemyShipListPlugin"].showEnemyShipsView(8); }).appendTo(filterMenu);
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
						item = localStorage.getItem("EnemyShipListPlugin." + game_id + "." + player_slot + ".scorehistory");
						if (item != null) {
							data_size += item.length * 2; //each symbol is 2 bytes on disk
						}
						item = localStorage.getItem("EnemyShipListPlugin." + game_id + "." + player_slot + ".minehistory");
					if (item != null) {
						data_size += item.length * 2; //each symbol is 2 bytes on disk
					}
					item = localStorage.getItem("EnemyShipListPlugin." + game_id + "." + player_slot + ".predicted");
						if (item != null) {
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

			} else if (view == 8) { //Build Predictor

				this.showBuildPredictor(html);
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
					var predictedCounts = vgap.plugins["enemyShipListPlugin"].countPredicted(player.id);
					capitalships_in_list += predictedCounts.capitals;
					freighters_in_list += predictedCounts.freighters;
					var predictedNote = function (n) { return n > 0 ? " <span style='font-style:italic' title='Predicted builds from the build predictor'>(" + n + " predicted)</span>" : ""; };

					//console.log("Player: " + player.id + " playing race: " + race.shortname + " and name: " + player.username);

					var color = this.colorsA[player.id];;
					html += "<tr>";

					html += "<td style='color:" + color + "'>" + player.id + "</td>";
					html += "<td style='color:" + color + "'>" + player.username + "</td>";
					html += "<td style='color:" + color + "'>" + race.shortname + "</td>";
					html += "<td style='color:" + color + "'> <div style='display: none;'>" + (capitalships_in_list / capitalships_total) + "</div>" + capitalships_in_list + " / " + capitalships_total + predictedNote(predictedCounts.capitals) + "</td>";
					html += "<td style='color:" + color + "'> <div style='display: none;'>" + (freighters_in_list / freighters_total) + "</div>" + freighters_in_list + " / " + freighters_total + predictedNote(predictedCounts.freighters) + "</td>";
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
					html += "<td style='color:" + color + "'>" + ship.name + vgap.plugins["enemyShipListPlugin"].mergeControlHtml(ship) + "</td>";
					if (vgap.plugins["enemyShipListPlugin"].enableEdit) {
						html += "<td><button type='button' class='TestButton' onClick='vgap.plugins[\"enemyShipListPlugin\"].removeShip(" + ship.id + "); " +
							"vgap.plugins[\"enemyShipListPlugin\"].showEnemyShipsView(" + view + ");'> Delete </button></td>";
					}
					html += "<td style='color:" + color + "'>" + ship.infoturn + "</td>";
					html += "<td style='color:" + color + "'>" + location + "</td>";
					//html += "<td style='color:"+ color +"' align='center'>" + ship.warp + "</td>";
					//parts of the loadout merged from a predicted build are italic, as in the predicted rows
					var mergedFields = ship.predictedLoadout ? ship.predictedLoadout.fields : {};
					var loadoutTd = function (field) {
						if (mergedFields[field] == null)
							return "<td style='color:" + color + "'>";
						return "<td style='color:" + color + "; font-style:italic;' title='Predicted: merged from the predicted build of turn " + ship.predictedLoadout.turn + ", not seen'>";
					};
					html += loadoutTd("engineid") + engine + "</td>";
					html += loadoutTd("beamid") + beam_weapons + "</td>";
					html += loadoutTd("torpedoid") + secondary_weapons + "</td>";
					html += loadoutTd("ammo") + ammo + "</td>";
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

			//predicted builds, listed like sightings but marked as predicted
			var predicted = vgap.plugins["enemyShipListPlugin"].getAllPredicted();
			for (var pi = 0; pi < predicted.length; pi++) {
				var ship = predicted[pi];
				if (view == 0 && ship.ownerid == vgap.player.id)
					continue;
				if (view == 1 && (!vgap.alliedTo(ship.ownerid) || ship.ownerid == vgap.player.id))
					continue;
				if (view == 2 && (vgap.alliedTo(ship.ownerid) || ship.ownerid == vgap.player.id))
					continue;
				if (view == 3 && ship.ownerid != vgap.plugins["enemyShipListPlugin"].playerFilterId)
					continue;
				var rowHtml = vgap.plugins["enemyShipListPlugin"].predictedShipRowHtml(ship);
				if (view == 3 && vgap.plugins["enemyShipListPlugin"].isFreighter(ship)) {
					$(rowHtml).appendTo("#FreighterRows");
					freighter_count++;
				} else {
					$(rowHtml).appendTo("#ShipRows");
					if (view == 3)
						war_count++;
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
		 * Store the scoreboard of the loaded turn so the build predictor can compare turns
		 */
		recordScores: function () {
			var plugin = this;
			if (!vgap.scores || vgap.scores.length == 0)
				return;

			var snapshot = {};
			for (var i = 0; i < vgap.scores.length; i++) {
				var score = vgap.scores[i];
				//turn 2 often still shows the scoreboard of turn 1, which is no record of turn 2
				if (score.turn != null && score.turn != vgap.game.turn)
					return;
				snapshot[score.ownerid] = plugin.scoreSnapshot(score);
			}
			this.scoreHistory[vgap.game.turn] = snapshot;
			this.saveScoreHistory();
		},

		/**
		 * Score history entry of a player from a scoreboard record
		 */
		scoreSnapshot: function (score) {
			return {
				c: score.capitalships, f: score.freighters, m: score.militaryscore, s: score.inventoryscore,
				dc: score.shipchange, df: score.freighterchange, dm: score.militarychange, ds: score.inventorychange
			};
		},

		/**
		 * Check if a recorded scoreboard is a placeholder: turn 1, and often turn 2, show every player
		 * without ships before the first scores are made
		 * @param snapshot	ownerid -> score history entry
		 */
		isPlaceholderScores: function (snapshot) {
			var owners = Object.keys(snapshot);
			for (var o = 0; o < owners.length; o++) {
				if (snapshot[owners[o]].c || snapshot[owners[o]].f)
					return false;
			}
			return true;
		},

		/**
		 * Save the score history to local storage. Kept apart from the ship list so a full storage
		 * only loses the score history and not the list.
		 */
		saveScoreHistory: function () {
			if (!this.enabled)
				return;
			try {
				localStorage.setItem(this.storage_path + "scorehistory", JSON.stringify(this.scoreHistory));
			} catch (err) {
				console.log("EnemyShipListPlugin: Not enough localStorage space to save the score history.");
			}
		},

		/**
		 * Store the units of the minefields seen in the loaded turn so the build predictor can tell the mines laid or lost
		 * in a turn from the ships built
		 */
		recordMinefields: function () {
			if (!vgap.minefields)
				return;
			var snapshot = {};
			for (var i = 0; i < vgap.minefields.length; i++) {
				var field = vgap.minefields[i];
				//fields not seen this turn show the units of their last sighting
				if (field.ownerid > 0 && field.infoturn == vgap.game.turn)
					snapshot[field.id] = [field.ownerid, field.units];
			}
			this.mineHistory[vgap.game.turn] = snapshot;
			this.mineIdCache = null;
			if (!this.enabled)
				return;
			try {
				localStorage.setItem(this.storage_path + "minehistory", JSON.stringify(this.mineHistory));
			} catch (err) {
				console.log("EnemyShipListPlugin: Not enough localStorage space to save the minefield history.");
			}
		},

		/**
		 * Fill the score history with the scoreboard of all past turns from the NU server
		 */
		loadScoreHistoryFromServer: function () {
			var plugin = vgap.plugins["enemyShipListPlugin"];
			if (typeof nu == "undefined" || !nu.api || !nu.api.request) {
				alert("This client cannot load the score history. It will be recorded as turns are loaded instead.");
				return;
			}
			nu.api.request("/game/loadscores", { gameid: vgap.gameId }, function (data) {
				if (!data || data.error || !data.scores) {
					alert("The score history could not be loaded" + (data && data.error ? ": " + data.error : "."));
					return;
				}
				for (var i = 0; i < data.scores.length; i++) {
					var score = data.scores[i];
					if (!plugin.scoreHistory[score.turn])
						plugin.scoreHistory[score.turn] = {};
					plugin.scoreHistory[score.turn][score.ownerid] = plugin.scoreSnapshot(score);
				}
				plugin.saveScoreHistory();
				plugin.showEnemyShipsView(8);
			});
		},

		/**
		 * Check if a ship is a freighter (hull without beams, launchers or bays)
		 * @param ship	ship
		 * @return 		true if freighter
		 */
		isFreighter: function (ship) {
			return this.isFreighterHull(vgap.getHull(ship.hullid));
		},

		isFreighterHull: function (hull) {
			return hull.beams == 0 && hull.launchers == 0 && hull.fighterbays == 0;
		},

		/**
		 * Military score points of a ship part: 1 per megacredit and 5 per kt of mineral (AutoScore)
		 * @param item		hull, engine, beam or torpedo
		 * @param costField	name of the megacredit field ("launchercost" for torpedo launchers)
		 */
		partValue: function (item, costField) {
			if (!item)
				return 0;
			return (item[costField] || 0) + 5 * ((item.tritanium || 0) + (item.duranium || 0) + (item.molybdenum || 0));
		},

		/**
		 * Military score points of a warship: full value of hull, engines, beams and launchers.
		 * Loaded torpedoes and fighters also count but are not part of the build.
		 */
		shipModelValue: function (hull, engine, beam, beamCount, torpedo, launcherCount) {
			return this.partValue(hull, "cost") +
				hull.engines * this.partValue(engine, "cost") +
				beamCount * this.partValue(beam, "cost") +
				launcherCount * this.partValue(torpedo, "launchercost");
		},

		/**
		 * Phase of the game a build turn falls in, by how full the ship limit was the turn before:
		 * the latest recorded scoreboard before the turn, else the closest one after it
		 * @param turn	build turn
		 * @return 		entry of estimatePhases with its fill (fraction of the ship limit in use, null if unknown)
		 */
		getBuildPhase: function (turn) {
			var before = null, after = null;
			var turnKeys = Object.keys(this.scoreHistory);
			for (var k = 0; k < turnKeys.length; k++) {
				var t = parseInt(turnKeys[k], 10);
				if (isNaN(t) || this.isPlaceholderScores(this.scoreHistory[turnKeys[k]]))
					continue;
				if (t < turn && (before == null || t > before))
					before = t;
				if (t >= turn && (after == null || t < after))
					after = t;
			}
			var source = before != null ? before : after;
			var limit = vgap.settings && vgap.settings.shiplimit;
			var fill = null;
			if (source != null && limit > 0) {
				var ships = 0;
				var snapshot = this.scoreHistory[source];
				var owners = Object.keys(snapshot);
				for (var o = 0; o < owners.length; o++)
					ships += (snapshot[owners[o]].c || 0) + (snapshot[owners[o]].f || 0);
				fill = ships / limit;
			}
			var key = "nearCap";
			if (fill != null && fill < this.estimateOpeningFill)
				key = "opening";
			else if (fill != null && fill < this.estimateEarlyFill)
				key = "early";
			else if (fill != null && fill >= 1)
				key = "afterCap";
			return { key: key, phase: this.estimatePhases[key], fill: fill };
		},

		/**
		 * Role of a warship hull: "scout" (small, two beams or fewer), "sweeper" (beams only, three or more, not large),
		 * "utility" (alchemy, refinery and tanker ships) or "fighter" (torpedoes, fighters or a large beam ship)
		 */
		getShipRole: function (hull) {
			if (/alchemy|refinery|tanker/i.test(hull.name))
				return "utility";
			if (hull.launchers == 0 && hull.fighterbays == 0) {
				if (hull.mass < 60 && hull.beams <= 2)
					return "scout";
				if (hull.beams >= 3 && hull.mass < 300)
					return "sweeper";
			}
			return "fighter";
		},

		/**
		 * The usual builds of a player's race in a phase of the game, from estimateRaceFocus
		 * @return 		[{hull, share, outfits: [{engine, beam, torpedo, share}]}], most built first; empty if unknown
		 */
		getRaceFocus: function (ownerid, phaseKey) {
			var player = vgap.getPlayer(ownerid);
			var table = player && this.estimateRaceFocus[player.raceid];
			var rows = table && table[phaseKey] ? table[phaseKey] : [];
			var focus = [];
			for (var r = 0; r < rows.length; r++) {
				var hull = vgap.getHull(rows[r][0]);
				if (!hull || this.isFreighterHull(hull))
					continue;
				var outfits = [];
				for (var o = 0; o < rows[r][2].length; o++) {
					var outfit = rows[r][2][o];
					var engine = vgap.getEngine(outfit[0]);
					if (engine)
						outfits.push({ engine: engine, beam: vgap.getBeam(outfit[1]) || null, torpedo: vgap.getTorpedo(outfit[2]) || null, share: outfit[3] });
				}
				focus.push({ hull: hull, share: rows[r][1], outfits: outfits });
			}
			return focus;
		},

		/**
		 * How likely a player is to build each hull, engine, beam and torpedo before a turn, as normalized weights.
		 * Tuned on complete games: builds mostly reuse hulls and weapons already in the fleet, engines are mostly
		 * the best (Transwarp) or the cheapest (StarDrive 1), and ships first seen right after a build turn are
		 * usually the new builds. Enemy engines are rarely visible, so every component keeps some weight.
		 * The phase of the game shifts the weights toward cheap or costly hulls and low or high tech components,
		 * and toward the hulls the player's race usually builds in that phase.
		 * @param ownerid	player id
		 * @param turn		build turn; ships first seen before it describe the fleet, ships first seen in it or the next turn are likely the builds
		 * @return 			{hulls, engines, beams, torpedos}: arrays of {item, p}, most likely first; focus: result of getRaceFocus;
		 * 					phase: result of getBuildPhase; seen: {fleet, fresh} warships of the player seen before the turn and fresh;
		 * 					known: counts per id of the hulls, components and fresh hulls seen; hullRanks: cost rank per hull id;
		 * 					bestEngine, cheapEngine: engine ids
		 */
		getBuildPriors: function (ownerid, turn) {
			var buildPhase = this.getBuildPhase(turn);
			var phase = buildPhase.phase;
			var hullWeight = {};
			var count = function (map, id) { map[id] = (map[id] || 0) + 1; };

			//every warship hull of the race is possible
			var race = vgap.getRace(vgap.getPlayer(ownerid).raceid);
			var raceHulls = race.hulls ? race.hulls.split(",") : [];
			var raceValues = [];
			for (var h = 0; h < raceHulls.length; h++) {
				var hull = vgap.getHull(parseInt(raceHulls[h], 10));
				if (hull && !this.isFreighterHull(hull)) {
					hullWeight[hull.id] = this.estimateRaceHullWeight;
					raceValues.push(this.partValue(hull, "cost"));
				}
			}

			var engines = {}, beams = {}, torpedos = {};
			var seen = { fleet: 0, fresh: 0 };
			var fleetHulls = {}, freshHulls = {};
			var known = this.getKnownShips(turn);
			for (var s = 0; s < known.length; s++) {
				var ship = known[s];
				if (ship.ownerid != ownerid || ship.id < 0)
					continue;
				var shipHull = vgap.getHull(ship.hullid);
				if (!shipHull || this.isFreighterHull(shipHull))
					continue;
				var firstSeen = this.getSeenTurns(ship).first;
				if (firstSeen < turn) {
					seen.fleet++;
					count(fleetHulls, shipHull.id);
					hullWeight[shipHull.id] = (hullWeight[shipHull.id] || 0) + 1;
					if (ship.engineid > 0 && vgap.getEngine(ship.engineid)) count(engines, ship.engineid);
					if (ship.beamid > 0 && vgap.getBeam(ship.beamid)) count(beams, ship.beamid);
					if (ship.torpedoid > 0 && vgap.getTorpedo(ship.torpedoid)) count(torpedos, ship.torpedoid);
				} else if (firstSeen < turn + this.estimateFreshTurns) {
					seen.fresh++;
					count(freshHulls, shipHull.id);
					hullWeight[shipHull.id] = (hullWeight[shipHull.id] || 0) + this.estimateFreshWeight;
				}
			}

			//the race's usual builds in this phase count as focusWeight ships, so they lead while little of the fleet is
			//known and the player's own ships take over as they are seen
			var focus = this.getRaceFocus(ownerid, buildPhase.key);
			for (var f = 0; f < focus.length; f++)
				hullWeight[focus[f].hull.id] = (hullWeight[focus[f].hull.id] || 0) + phase.focusWeight * focus[f].share;

			//by phase, favor cheap or costly hulls: rank 0 for the race's cheapest warship hull, 1 for its costliest
			var hullIds = Object.keys(hullWeight);
			var hullRanks = {};
			for (var k = 0; k < hullIds.length; k++) {
				var value = this.partValue(vgap.getHull(parseInt(hullIds[k], 10)), "cost");
				var cheaper = raceValues.filter(function (v) { return v < value; }).length;
				var rank = raceValues.length > 1 ? Math.min(1, cheaper / (raceValues.length - 1)) : 0.5;
				hullRanks[hullIds[k]] = rank;
				hullWeight[hullIds[k]] *= Math.exp(phase.hullSlope * (rank - 0.5));
			}

			var sorted = function (weights, lookup) {
				var total = 0;
				var keys = Object.keys(weights);
				for (var k = 0; k < keys.length; k++)
					total += weights[keys[k]];
				return keys.map(function (k) { return { item: lookup(parseInt(k, 10)), p: weights[k] / total }; })
					.filter(function (e) { return e.item; })
					.sort(function (a, b) { return b.p - a.p; });
			};
			//components: 1 for each, more for the ones seen in the fleet and a few likely defaults,
			//scaled toward low or high tech by the phase
			var componentWeights = function (table, seen, extra, techSlope) {
				var weights = {};
				var seenTotal = 0;
				var keys = Object.keys(seen);
				for (var k = 0; k < keys.length; k++)
					seenTotal += seen[keys[k]];
				for (var i = 0; i < table.length; i++)
					weights[table[i].id] = (1 + (extra[table[i].id] || 0) + (seenTotal ? phase.seenWeight * table.length * (seen[table[i].id] || 0) / seenTotal : 0)) *
						Math.exp((techSlope || 0) * (table[i].techlevel - 5.5) / 9);
				return weights;
			};
			var byTech = function (list, best) {
				var top = null;
				for (var i = 0; i < list.length; i++) {
					if (!top || (best ? list[i].techlevel > top.techlevel : list[i].techlevel < top.techlevel))
						top = list[i];
				}
				return top ? top.id : 0;
			};
			var engineExtra = {};
			engineExtra[byTech(vgap.engines, true)] = phase.bestEngine;
			engineExtra[byTech(vgap.engines, false)] = phase.cheapEngine;
			var beamExtra = {};
			beamExtra[byTech(vgap.beams, true)] = 1;
			var torpedoExtra = {};
			torpedoExtra[byTech(vgap.torpedos, true)] = 1;

			return {
				hulls: sorted(hullWeight, function (id) { return vgap.getHull(id); }),
				engines: sorted(componentWeights(vgap.engines, engines, engineExtra, 0), function (id) { return vgap.getEngine(id); }),
				beams: sorted(componentWeights(vgap.beams, beams, beamExtra, phase.beamSlope), function (id) { return vgap.getBeam(id); }),
				torpedos: sorted(componentWeights(vgap.torpedos, torpedos, torpedoExtra, phase.torpedoSlope), function (id) { return vgap.getTorpedo(id); }),
				focus: focus,
				phase: buildPhase,
				seen: seen,
				known: { hulls: fleetHulls, fresh: freshHulls, engines: engines, beams: beams, torpedos: torpedos },
				hullRanks: hullRanks,
				bestEngine: byTech(vgap.engines, true),
				cheapEngine: byTech(vgap.engines, false)
			};
		},

		/**
		 * Find the sets of warships that best explain a turn's military score change. Each ship gets a hull with full
		 * beams and launchers; ships can differ in engine and weapons. A set is scored on how likely its hulls and
		 * outfits are and on how often builds in complete games were worth that fraction of the change: no set is worth
		 * more than estimateMaxOver times the change, and one worth less is common, as ammo, defense and minefields built in
		 * the same turn add to the change. Only the best scoring set of components is kept for each combination of hulls.
		 * @param ownerid	player id
		 * @param count		number of warships built
		 * @param target	military score change
		 * @param turn		build turn
		 * @return 			{ranked: [{ships: [{hull, engine, beam, torpedo}], value, diff, score, confidence}] best first, closest: the
		 * 					same closest to the change first, phase: result of getBuildPhase, focus: result of getRaceFocus,
		 * 					seen: warships of the player seen (getBuildPriors), listed: chance the hulls built are in ranked}
		 */
		estimateBuilds: function (ownerid, count, target, turn) {
			var plugin = this;
			var priors = this.getBuildPriors(ownerid, turn);
			var phase = priors.phase.phase;
			var engines = priors.engines.slice(0, 4);
			var beams = priors.beams.slice(0, 4);
			var torpedos = priors.torpedos.slice(0, 3);

			var focusOutfits = {};
			for (var f = 0; f < priors.focus.length; f++)
				focusOutfits[priors.focus[f].hull.id] = priors.focus[f].outfits;

			//every single ship option with its value and likelihood: the hull's, times a mix of the outfits the race
			//usually puts on the hull and of the components of the fleet and the phase
			var options = [];
			var byKey = {};
			var addOption = function (hull, engine, beam, torpedo, p, outfitShare) {
				var key = hull.id + "|" + engine.id + "|" + (beam ? beam.id : 0) + "|" + (torpedo ? torpedo.id : 0);
				if (!byKey[key]) {
					byKey[key] = { hull: hull, engine: engine, beam: beam, torpedo: torpedo, p: 0,
						value: plugin.shipModelValue(hull, engine, beam, hull.beams, torpedo, hull.launchers), outfitShare: 0 };
					options.push(byKey[key]);
				}
				byKey[key].p += p;
				byKey[key].outfitShare += outfitShare || 0;
			};
			for (var h = 0; h < priors.hulls.length; h++) {
				var hull = priors.hulls[h].item;
				var outfits = (focusOutfits[hull.id] || []).filter(function (o) { return (!o.beam || hull.beams > 0) && (!o.torpedo || hull.launchers > 0); });
				var focusShare = outfits.length > 0 ? phase.focusOutfit : 0;
				for (var o = 0; o < outfits.length; o++)
					addOption(hull, outfits[o].engine, outfits[o].beam, outfits[o].torpedo, priors.hulls[h].p * focusShare * outfits[o].share, outfits[o].share);
				var hullBeams = hull.beams > 0 ? beams : [null];
				var hullTorpedos = hull.launchers > 0 ? torpedos : [null];
				for (var e = 0; e < engines.length; e++) {
					for (var b = 0; b < hullBeams.length; b++) {
						for (var t = 0; t < hullTorpedos.length; t++) {
							var beam = hullBeams[b], torpedo = hullTorpedos[t];
							addOption(hull, engines[e].item, beam ? beam.item : null, torpedo ? torpedo.item : null,
								priors.hulls[h].p * (1 - focusShare) * engines[e].p * (beam ? beam.p : 1) * (torpedo ? torpedo.p : 1));
						}
					}
				}
			}
			//judge each outfit against the hull's likeliest one, so hulls with more weapon choices (torpedoes as well as
			//beams) are not less likely only because their likelihood is spread over more outfits
			var bestOutfit = {}, hullP = {};
			for (var h = 0; h < priors.hulls.length; h++)
				hullP[priors.hulls[h].item.id] = priors.hulls[h].p;
			for (var o = 0; o < options.length; o++)
				bestOutfit[options[o].hull.id] = Math.max(bestOutfit[options[o].hull.id] || 0, options[o].p);
			for (var o = 0; o < options.length; o++)
				options[o].logp = Math.log(hullP[options[o].hull.id]) + phase.outfitWeight * Math.log(options[o].p / bestOutfit[options[o].hull.id]);

			//how unlikely it is that ships worth 'value' explain the military change, by how often builds were worth that
			//fraction of the change in complete games
			var edges = this.estimateFitEdges;
			var fitFloor = this.estimateFitFloor;
			var fitPenalty = function (value) {
				var x = value / target;
				var density = fitFloor;
				for (var i = 0; i < edges.length - 1; i++) {
					if (x >= edges[i] && x < edges[i + 1])
						density = Math.max(fitFloor, phase.fit[i] / (edges[i + 1] - edges[i]));
				}
				return -phase.fitWeight * Math.log(density);
			};

			//beam search over sets of 'count' options, judging partial sets by their value scaled up to 'count' ships
			var states = [{ value: 0, logp: 0, last: 0, picks: [] }];
			for (var k = 0; k < count; k++) {
				var next = [];
				for (var s = 0; s < states.length; s++) {
					var state = states[s];
					for (var o = state.last; o < options.length; o++) {
						var value = state.value + options[o].value;
						//no set worth much more than the military change
						if (value > target * this.estimateMaxOver)
							continue;
						var logp = state.logp + options[o].logp;
						next.push({ value: value, logp: logp, last: o, picks: state.picks.concat([o]),
							score: fitPenalty(value * count / (k + 1)) - logp * count / (k + 1) });
					}
				}
				next.sort(function (a, b) { return a.score - b.score; });
				states = next.slice(0, this.estimateSearchWidth);
			}

			states.sort(function (a, b) { return (fitPenalty(a.value) - a.logp) - (fitPenalty(b.value) - b.logp); });
			//the sets kept by the search are ranked by the learned ranker, which judges each set as a whole; lower score is better
			for (var o = 0; o < options.length; o++)
				options[o].stats = this.getOptionStats(options[o], priors, hullP);
			var context = { fill: priors.phase.fill, turn: turn, count: count, target: target, raceid: vgap.getPlayer(ownerid).raceid, priors: priors,
				bestScore: states.length > 0 ? fitPenalty(states[0].value) - states[0].logp : 0, statesKept: states.length };
			for (var s = 0; s < states.length; s++) {
				states[s].searchScore = fitPenalty(states[s].value) - states[s].logp;
				states[s].features = this.getBuildFeatures(states[s], s, options, fitPenalty(states[s].value), context);
				states[s].score = this.estimateRanker ? -this.getRankerScore(states[s].features) : states[s].searchScore;
			}
			states.sort(function (a, b) { return a.score - b.score; });
			var toResult = function (state) {
				return { ships: state.picks.map(function (o) { return options[o]; }), value: state.value, diff: state.value - target,
					score: state.score, features: state.features };
			};
			var ranked = [];
			var hullSets = {};
			for (var s = 0; s < states.length && ranked.length < this.estimateResults; s++) {
				var result = toResult(states[s]);
				var hullSet = result.ships.map(function (ship) { return ship.hull.id; }).sort(function (a, b) { return a - b; }).join(",");
				if (hullSets[hullSet])
					continue;
				hullSets[hullSet] = true;
				ranked.push(result);
			}
			var seen = priors.seen.fleet + priors.seen.fresh > 0;
			this.setConfidence(ranked, priors.phase.key, seen, count);
			//every set the search kept, closest to the military change first (likeliest first when equally close)
			var closest = states.map(toResult);
			closest.sort(function (a, b) { return Math.abs(a.diff) - Math.abs(b.diff); });
			return { ranked: ranked, closest: closest.slice(0, this.estimateClosestResults), phase: priors.phase, focus: priors.focus,
				seen: priors.seen, listed: ranked.length > 0 ? this.getListedShare(priors.phase.key, seen, count) : 0 };
		},

		/**
		 * What the ranker knows of one ship option, in the order of estimateOptionStats
		 * @param option	{hull, engine, beam, torpedo, value, logp, outfitShare} from estimateBuilds
		 * @param priors	result of getBuildPriors
		 * @param hullP		likelihood per hull id
		 */
		getOptionStats: function (option, priors, hullP) {
			var hull = option.hull, known = priors.known, share = 0, inFocus = 0;
			for (var f = 0; f < priors.focus.length; f++) {
				if (priors.focus[f].hull.id == hull.id) {
					share = priors.focus[f].share;
					inFocus = 1;
				}
			}
			var role = this.getShipRole(hull);
			var hullLogp = Math.log(hullP[hull.id]);
			var inFleet = known.hulls[hull.id] || 0;
			return [hullLogp, option.logp - hullLogp, share, inFocus, option.outfitShare, inFleet > 0 ? 1 : 0, inFleet, known.fresh[hull.id] ? 1 : 0, priors.hullRanks[hull.id] || 0,
				option.value, hull.mass, hull.techlevel, hull.beams, hull.launchers, hull.fighterbays,
				option.engine.techlevel, option.engine.id == priors.bestEngine ? 1 : 0, option.engine.id == priors.cheapEngine ? 1 : 0,
				option.beam ? option.beam.techlevel : 0, option.torpedo ? option.torpedo.techlevel : 0,
				known.engines[option.engine.id] ? 1 : 0, option.beam && known.beams[option.beam.id] ? 1 : 0, option.torpedo && known.torpedos[option.torpedo.id] ? 1 : 0,
				role == "scout" ? 1 : 0, role == "sweeper" ? 1 : 0, role == "utility" ? 1 : 0, role == "fighter" ? 1 : 0];
		},

		/**
		 * What the ranker knows of a set of ships kept by the search, in the order of estimateRankerFeatures then estimateOptionStats
		 * @param state		set from the search, with its searchScore
		 * @param index		place of the set among the kept sets by searchScore, best first
		 * @param options	ship options of the search, with their stats
		 * @param penalty	how unlikely the set's value is for the military change
		 * @param context	{fill, turn, count, target, raceid, priors, bestScore, statesKept}
		 * @return 			array of numbers
		 */
		getBuildFeatures: function (state, index, options, penalty, context) {
			var seen = context.priors.seen, known = context.priors.known;
			var picks = state.picks, n = picks.length;
			var means = this.estimateOptionStats.map(function () { return 0; });
			var hullCounts = {}, optionsUsed = {};
			var minHullLogp = Infinity, minFocus = Infinity, maxRank = 0, maxTech = 0, distinctHulls = 0, distinctOptions = 0, topHull = 0;
			for (var p = 0; p < n; p++) {
				var option = options[picks[p]], stats = option.stats;
				for (var i = 0; i < stats.length; i++)
					means[i] += stats[i] / n;
				minHullLogp = Math.min(minHullLogp, stats[0]);
				minFocus = Math.min(minFocus, stats[2]);
				maxRank = Math.max(maxRank, stats[8]);
				maxTech = Math.max(maxTech, stats[11]);
				if (!hullCounts[option.hull.id])
					distinctHulls++;
				hullCounts[option.hull.id] = (hullCounts[option.hull.id] || 0) + 1;
				topHull = Math.max(topHull, hullCounts[option.hull.id]);
				if (!optionsUsed[picks[p]])
					distinctOptions++;
				optionsUsed[picks[p]] = true;
			}
			//ships first seen around the build that this set accounts for
			var covered = 0;
			var freshIds = Object.keys(known.fresh);
			for (var f = 0; f < freshIds.length; f++)
				covered += Math.min(known.fresh[freshIds[f]], hullCounts[freshIds[f]] || 0);
			var ratio = context.target > 0 ? state.value / context.target : 0;
			return [context.fill == null ? -1 : context.fill, (vgap.settings && vgap.settings.shiplimit) || 0, context.turn, context.count, context.target, context.raceid, seen.fleet, seen.fresh,
				state.searchScore, state.searchScore - context.bestScore, index / Math.max(1, context.statesKept), penalty, ratio, Math.abs(1 - ratio), state.value, state.logp,
				distinctHulls / n, distinctOptions / n, topHull / n, seen.fresh > 0 ? covered / seen.fresh : 0, minHullLogp, minFocus, maxRank, maxTech].concat(means);
		},

		/**
		 * Score of a set by the learned ranker (estimateRanker), higher is better
		 * @param features	result of getBuildFeatures
		 */
		getRankerScore: function (features) {
			var trees = this.estimateRanker.trees, total = 0;
			for (var t = 0; t < trees.length; t++) {
				var nodes = trees[t][0], at = nodes.length > 0 ? 0 : -1;
				while (at >= 0)
					at = features[nodes[at * 4]] <= nodes[at * 4 + 1] ? nodes[at * 4 + 2] : nodes[at * 4 + 3];
				total += trees[t][1][~at];
			}
			return total;
		},

		/**
		 * How often the hulls built are among the listed builds in complete games (estimateListed)
		 * @param phaseKey	key of estimatePhases
		 * @param seen		true if a warship of the player was seen by the build turn or the turn after
		 * @param count		warships built
		 */
		getListedShare: function (phaseKey, seen, count) {
			var table = this.estimateListed[phaseKey] || this.estimateListed.nearCap;
			var row = table[seen ? "seen" : "unseen"];
			return row[Math.min(count, row.length) - 1];
		},

		/**
		 * Set the confidence of each listed build: the chance its hulls are the ones built. The listed builds share the chance
		 * that the hulls built are listed at all (getListedShare), by how much better each one scores than the others.
		 * @param ranked	results of estimateBuilds, best first, each with its score (lower is better)
		 */
		setConfidence: function (ranked, phaseKey, seen, count) {
			if (ranked.length == 0)
				return;
			var listed = this.getListedShare(phaseKey, seen, count);
			var total = 0;
			for (var r = 0; r < ranked.length; r++) {
				ranked[r].confidence = Math.exp(-(ranked[r].score - ranked[0].score) / this.estimateConfidenceSpread);
				total += ranked[r].confidence;
			}
			for (var r = 0; r < ranked.length; r++)
				ranked[r].confidence *= listed / total;
		},

		//starbase builds that make up the military change the ships leave unexplained, from complete games before the ship limit:
		//	value: military score points each; share: turns with such a build; mean: points such a build is usually worth
		//	(exponential fit to the median)
		estimateStarbaseItems: {
			fighters: { name: "starbase fighters", value: 62.5, share: 0.12, mean: 2525 },
			starbaseDefense: { name: "starbase defense posts", value: 7.5, share: 0.04, mean: 1125 },
			planetDefense: { name: "planetary defense posts", value: 5.5, share: 0.51, mean: 301 },
			ammo: { share: 0.36, mean: 1523 }	//torpedoes or fighters loaded on ships
		},

		/**
		 * The likeliest starbase builds that make up the military change the ships leave unexplained: starbase fighters,
		 * starbase and planetary defense posts and ammo loaded on ships (torpedoes, or fighters for a carrier fleet).
		 * Each kind of build costs more the rarer it is and the more points it is worth next to its usual size
		 * (estimateStarbaseItems), and the cheapest mix that makes up the change wins.
		 * @param ownerid	player id
		 * @param ships		predicted warships [{hull, torpedo}]
		 * @param rest		military change the ships leave unexplained
		 * @param turn		build turn
		 * @return 			{items: [{name, count, value}], value} or null if nothing is left to explain
		 */
		estimateStarbaseBuilds: function (ownerid, ships, rest, turn) {
			if (!(rest > 0))
				return null;
			var I = this.estimateStarbaseItems;
			var starbases = Math.max(1, getNumForPlayer(ownerid, "starbases"));
			var ammo = this.getLoadedAmmo(ownerid, ships, turn);
			//-log likelihood of a build worth 'points': how often the kind is built, times an exponential in its size
			var cost = function (item, points) {
				return points > 0 ? -Math.log(item.share) + Math.log(item.mean) + points / item.mean : 0;
			};

			var best = null;
			var maxFighters = Math.min(60 * starbases, Math.floor(rest / I.fighters.value));
			//planetary defense posts cost the most per point, so next to other builds they only fill the last few points;
			//on their own they can make up a few hundred posts
			var maxPlanet = Math.min(400, Math.floor(rest / I.planetDefense.value));
			for (var f = 0; f <= maxFighters; f++) {
				for (var p = 0; p <= (f == 0 ? maxPlanet : Math.min(maxPlanet, 40)); p++) {
					var r = rest - f * I.fighters.value - p * I.planetDefense.value;
					if (r < -0.5)
						break;
					//the rest goes to ammo, then starbase defense posts
					var a = ammo && r >= ammo.value ? Math.floor(r / ammo.value) : 0;
					var options = a > 0 ? [0, a] : [0];
					for (var o = 0; o < options.length; o++) {
						var left = r - options[o] * (ammo ? ammo.value : 0);
						var b = Math.min(200 * starbases, Math.max(0, Math.round(left / I.starbaseDefense.value)));
						var err = Math.max(0, Math.abs(left - b * I.starbaseDefense.value) - 0.5);
						var score = 10 * err + cost(I.fighters, f * I.fighters.value) + cost(I.planetDefense, p * I.planetDefense.value) +
							cost(I.starbaseDefense, b * I.starbaseDefense.value) + cost(I.ammo, options[o] * (ammo ? ammo.value : 0));
						if (!best || score < best.score)
							best = { score: score, f: f, p: p, a: options[o], b: b };
					}
				}
			}
			var items = [
				{ name: I.fighters.name, count: best.f, value: best.f * I.fighters.value },
				{ name: ammo ? ammo.name : "", count: best.a, value: best.a * (ammo ? ammo.value : 0) },
				{ name: I.starbaseDefense.name, count: best.b, value: best.b * I.starbaseDefense.value },
				{ name: I.planetDefense.name, count: best.p, value: best.p * I.planetDefense.value }
			].filter(function (item) { return item.count > 0; });
			var value = 0;
			for (var i = 0; i < items.length; i++)
				value += items[i].value;
			return { items: items, value: value };
		},

		/**
		 * Ammo a player likely loads on ships: fighters (125 points each) when the predicted ships or else the fleet
		 * known by the build turn are mostly carriers, otherwise the torpedo they carry most often (1 point per megacredit)
		 * @return 		{name, value} or null if neither carriers nor torpedo ships are known
		 */
		getLoadedAmmo: function (ownerid, ships, turn) {
			var carriers = 0, torpedoShips = 0, torpedo = null;
			for (var s = 0; s < ships.length; s++) {
				if (ships[s].hull.fighterbays > 0)
					carriers++;
				else if (ships[s].torpedo) {
					torpedoShips++;
					torpedo = ships[s].torpedo;
				}
			}
			if (carriers + torpedoShips == 0) {
				var known = this.getKnownShips(turn);
				for (var s = 0; s < known.length; s++) {
					var ship = known[s];
					var hull = ship.ownerid == ownerid && this.getSeenTurns(ship).first <= turn ? vgap.getHull(ship.hullid) : null;
					if (hull && hull.fighterbays > 0)
						carriers++;
					else if (hull && ship.torps > 0 && ship.torpedoid > 0)
						torpedoShips++;
				}
				torpedo = this.getFleetTorpedo(ownerid, turn);
			}
			if (carriers > 0 && carriers >= torpedoShips)
				return { name: "fighters loaded", value: 125 };
			if (torpedo && torpedo.torpedocost > 0)
				return { name: torpedo.name + " torpedoes loaded", value: torpedo.torpedocost };
			return null;
		},

		/**
		 * The torpedo a player's ships known by a turn carry most often
		 * @return 		torpedo, null if no torpedo ship is known
		 */
		getFleetTorpedo: function (ownerid, turn) {
			var counts = {};
			var best = 0;
			var known = this.getKnownShips(turn);
			for (var s = 0; s < known.length; s++) {
				var ship = known[s];
				if (ship.ownerid != ownerid || !(ship.torpedoid > 0) || !(ship.torps > 0) || this.getSeenTurns(ship).first > turn)
					continue;
				counts[ship.torpedoid] = (counts[ship.torpedoid] || 0) + 1;
				if (!best || counts[ship.torpedoid] > counts[best])
					best = ship.torpedoid;
			}
			return best ? vgap.getTorpedo(best) : null;
		},

		/**
		 * Military score change from a player's minefields, comparing the fields seen in a turn with the turn before the
		 * score row starts: mineValue points per mine unit gained or lost, less the torpedoes the laid mines were made of.
		 * A field seen in both turns was laid in if it holds more than decay leaves; a field first seen with a higher id
		 * than any field seen before was laid in the turn. Fields not seen in the turn are left out.
		 * @param ownerid	player id
		 * @param fromTurn	first turn of the score row
		 * @param turn		turn of the score row
		 * @return 			{fields, laid, units (change), torpedo, torpedoes (points used up), value} or null if no field of the
		 * 					player was seen in the turn or the minefields of the turn before were not recorded
		 */
		getMineChange: function (ownerid, fromTurn, turn) {
			var now = this.mineHistory[turn];
			var prev = this.mineHistory[fromTurn - 1];
			if (!now || !prev)
				return null;
			//highest minefield id seen before the turn, by turn
			if (!this.mineIdCache || this.mineIdCache.history !== this.mineHistory) {
				var turns = Object.keys(this.mineHistory).map(function (t) { return parseInt(t, 10); }).sort(function (a, b) { return a - b; });
				var max = {}, highest = 0;
				for (var k = 0; k < turns.length; k++) {
					max[turns[k]] = highest;
					for (var id in this.mineHistory[turns[k]])
						highest = Math.max(highest, parseInt(id, 10));
				}
				this.mineIdCache = { history: this.mineHistory, max: max };
			}
			var known = this.mineIdCache.max[fromTurn] || 0;
			var keep = Math.pow(1 - this.mineDecay, turn - fromTurn + 1);
			var fields = 0, laid = 0, units = 0;
			for (var id in now) {
				if (now[id][0] != ownerid)
					continue;
				fields++;
				var before = prev[id] && prev[id][0] == ownerid ? prev[id][1] : null;
				if (before != null) {
					units += now[id][1] - before;
					laid += Math.max(0, now[id][1] - Math.floor(before * keep));
				} else if (parseInt(id, 10) > known) {
					units += now[id][1];
					laid += now[id][1];
				}
			}
			if (fields == 0)
				return null;
			//the torpedo the fleet carries most often, else the one the race usually builds
			var torpedo = this.getFleetTorpedo(ownerid, turn);
			if (!torpedo) {
				var focus = this.getRaceFocus(ownerid, this.getBuildPhase(turn).key);
				var shares = {}, best = 0;
				for (var f = 0; f < focus.length; f++) {
					for (var o = 0; o < focus[f].outfits.length; o++) {
						var t = focus[f].outfits[o].torpedo;
						if (t)
							shares[t.id] = (shares[t.id] || 0) + focus[f].share * focus[f].outfits[o].share;
					}
				}
				for (var id in shares) {
					if (shares[id] > best) {
						best = shares[id];
						torpedo = vgap.getTorpedo(parseInt(id, 10));
					}
				}
			}
			var player = vgap.getPlayer(ownerid);
			var perTorpedo = torpedo ? torpedo.id * torpedo.id * (player && player.raceid == 9 ? 4 : 1) : 0;
			var torpedoes = perTorpedo > 0 ? laid / perTorpedo * torpedo.torpedocost : 0;
			return { fields: fields, laid: laid, units: units, torpedo: torpedo, torpedoes: torpedoes, value: this.mineValue * units - torpedoes };
		},

		/**
		 * Html text of starbase builds from estimateStarbaseBuilds
		 */
		starbaseBuildsText: function (builds) {
			if (!builds)
				return "---";
			return builds.items.map(function (item) { return item.count + " " + item.name + " (" + Math.round(item.value) + ")"; }).join("<br>");
		},

		/**
		 * Seen ships and predicted builds together, as the fleet known before a build turn
		 * @param turn		build turn: predicted builds of this turn or later are left out, so a stored prediction does
		 * 					not count toward its own turn; undefined to keep all
		 * @return 			list of ship entries
		 */
		getKnownShips: function (turn) {
			var predicted = this.getAllPredicted().filter(function (ship) { return turn == null || ship.predictedTurn < turn; });
			return this.enemyShipList.concat(predicted);
		},

		/**
		 * Stored predicted builds and the starting freighters not seen yet
		 */
		getAllPredicted: function () {
			//a predicted build merged into a seen ship is that ship, so it is not listed or counted again
			var unmerged = this.predictedShips.filter(function (ship) { return ship.mergedShipId == null; });
			return unmerged.concat(this.getStartingShips());
		},

		/**
		 * The freighter every player starts with on turn 1 (a Medium Deep Space Freighter with Transwarp engines in all
		 * complete games), as a predicted ship for each player whose starting freighter is not in the list. Starting ships
		 * get the lowest ids, one per player, so a seen Medium Deep Space Freighter of the player with such an id is it.
		 * @return 		predicted ship entries marked starting
		 */
		getStartingShips: function () {
			var hull = null, engine = null;
			if (!vgap.hulls || !vgap.engines || !vgap.players)
				return [];
			for (var h = 0; h < vgap.hulls.length; h++) {
				if (/medium deep space freighter/i.test(vgap.hulls[h].name))
					hull = vgap.hulls[h];
			}
			for (var e = 0; e < vgap.engines.length; e++) {
				if (/transwarp/i.test(vgap.engines[e].name))
					engine = vgap.engines[e];
			}
			if (!hull || !vgap.players)
				return [];
			var seen = {};
			for (var s = 0; s < this.enemyShipList.length; s++) {
				var ship = this.enemyShipList[s];
				if (ship.hullid == hull.id && ship.id > 0 && ship.id <= vgap.players.length)
					seen[ship.ownerid] = true;
			}
			var ships = [];
			for (var p = 0; p < vgap.players.length; p++) {
				var ownerid = vgap.players[p].id;
				//the ships of yourself, full allies and players sharing intel are all seen
				if (seen[ownerid] || this.isSharedPlayer(ownerid))
					continue;
				var n = new ShipMin();
				delete n.id;
				n.name = hull.name;
				n.ownerid = ownerid;
				n.hullid = hull.id;
				n.mass = hull.mass;
				n.engineid = engine ? engine.id : 0;
				n.ammo = -1;
				n.damage = -1;
				n.crew = -1;
				n.predicted = true;
				n.starting = true;
				n.predictedTurn = 1;
				ships.push(n);
			}
			return ships;
		},

		/**
		 * Predicted builds of a player in a turn
		 * @param freighters	true for freighters only, false for warships only, undefined for both
		 */
		getPredictedBuild: function (ownerid, turn, freighters) {
			var plugin = this;
			return this.predictedShips.filter(function (ship) {
				return ship.ownerid == ownerid && ship.predictedTurn == turn && (freighters == null || plugin.isFreighter(ship) == freighters);
			});
		},

		/**
		 * Number of predicted warships and freighters of a player
		 */
		countPredicted: function (ownerid) {
			var counts = { capitals: 0, freighters: 0 };
			var predicted = this.getAllPredicted();
			for (var p = 0; p < predicted.length; p++) {
				if (predicted[p].ownerid != ownerid)
					continue;
				if (this.isFreighter(predicted[p]))
					counts.freighters++;
				else
					counts.capitals++;
			}
			return counts;
		},

		/**
		 * Key of a set of ships by hull and outfit, the same for the same ships in any order
		 * @param ships		[{hullid, engineid, beamid, torpedoid}]
		 */
		predictionKey: function (ships) {
			return ships.map(function (ship) { return ship.hullid + "|" + ship.engineid + "|" + (ship.beamid || 0) + "|" + (ship.torpedoid || 0); }).sort().join(",");
		},

		/**
		 * predictionKey of a configuration from estimateBuilds
		 */
		resultKey: function (result) {
			return this.predictionKey(result.ships.map(function (ship) {
				return { hullid: ship.hull.id, engineid: ship.engine.id, beamid: ship.beam ? ship.beam.id : 0, torpedoid: ship.torpedo ? ship.torpedo.id : 0 };
			}));
		},

		/**
		 * A stored predicted build as a configuration like those of estimateBuilds, worth what its ships are built with
		 * @param ships		predicted ships of a turn
		 * @param target	military score change of the turn
		 */
		predictedResult: function (ships, target) {
			var result = { ships: [], value: 0, custom: false };
			for (var s = 0; s < ships.length; s++) {
				var ship = ships[s];
				var hull = vgap.getHull(ship.hullid);
				var engine = vgap.getEngine(ship.engineid);
				var beam = ship.beams > 0 ? vgap.getBeam(ship.beamid) : null;
				var torpedo = ship.torps > 0 ? vgap.getTorpedo(ship.torpedoid) : null;
				result.ships.push({ hull: hull, engine: engine, beam: beam, torpedo: torpedo });
				result.value += this.shipModelValue(hull, engine, beam, ship.beams, torpedo, ship.torps);
				result.custom = result.custom || !!ship.custom;
			}
			result.diff = result.value - target;
			return result;
		},

		/**
		 * Store ships as the predicted build of a player's turn, replacing the predicted warships (or freighters) stored before
		 * @param ships		[{hull, engine, beam, torpedo}], with beams and torps when not fully armed
		 * @param freighters	true if the ships are freighters
		 * @param custom		true for a build put together in the manual build
		 */
		setPrediction: function (ownerid, turn, ships, freighters, custom) {
			var plugin = this;
			this.dropPredictions(function (ship) {
				return ship.ownerid == ownerid && ship.predictedTurn == turn && plugin.isFreighter(ship) == freighters;
			});
			for (var s = 0; s < ships.length; s++) {
				var hull = ships[s].hull;
				var n = new ShipMin();
				delete n.id;
				n.name = hull.name;
				n.ownerid = ownerid;
				n.hullid = hull.id;
				n.mass = hull.mass;
				n.engineid = ships[s].engine ? ships[s].engine.id : 0;
				n.beamid = ships[s].beam ? ships[s].beam.id : 0;
				n.beams = ships[s].beam ? (ships[s].beams != null ? ships[s].beams : hull.beams) : 0;
				n.torpedoid = ships[s].torpedo ? ships[s].torpedo.id : 0;
				n.torps = ships[s].torpedo ? (ships[s].torps != null ? ships[s].torps : hull.launchers) : 0;
				n.ammo = ships[s].ammo != null ? ships[s].ammo : -1;
				n.custom = !!custom;
				n.damage = -1;
				n.crew = -1;
				n.infoturn = turn;
				n.predicted = true;
				n.predictedTurn = turn;
				n.storedListTurn = this.currentListTurn;
				this.predictedShips.push(n);
			}
			this.savePredictedShips();
		},

		/**
		 * Store a configuration of the build estimate as the predicted build of its turn
		 * @param index		position of the configuration in estimateCandidates.ranked
		 */
		storePrediction: function (index) {
			var candidates = this.estimateCandidates;
			if (!candidates || !candidates.ranked[index])
				return;
			this.setPrediction(candidates.ownerid, candidates.turn, candidates.ranked[index].ships, false);
			this.refreshKeepScroll();
		},

		/**
		 * Store the manual build as a custom predicted build of the turn shown in the build estimate: its ships as
		 * predicted warships, or as predicted freighters for a freighter hull
		 */
		storeManualPrediction: function () {
			var state = this.manualBuild;
			var hull = state ? vgap.getHull(state.hullid) : null;
			if (!hull || this.manualTurn == null || !(state.count > 0))
				return;
			var ship = {
				hull: hull, engine: vgap.getEngine(state.engineid),
				beam: state.beams > 0 ? vgap.getBeam(state.beamid) : null, beams: state.beams,
				torpedo: state.launchers > 0 ? vgap.getTorpedo(state.torpedoid) : null, torps: state.launchers,
				ammo: state.ammo > 0 ? state.ammo : null
			};
			var ships = [];
			for (var c = 0; c < state.count; c++)
				ships.push(ship);
			this.setPrediction(state.ownerid, this.manualTurn, ships, this.isFreighterHull(hull), true);
			this.refreshKeepScroll();
		},

		/**
		 * Store the usual starting freighter as a predicted build of turn 2
		 */
		storeStarterFreighter: function (ownerid, turn) {
			var starter = this.getStarterFreighter();
			if (!starter.hullItem)
				return;
			this.setPrediction(ownerid, turn, [{ hull: starter.hullItem, engine: starter.engineItem, beam: null, torpedo: null }], true);
			this.refreshKeepScroll();
		},

		/**
		 * Remove the predicted build of a player's turn
		 * @param freighters	true for the predicted freighters only, false for the warships only, undefined for both
		 */
		removePrediction: function (ownerid, turn, freighters) {
			var plugin = this;
			this.dropPredictions(function (ship) {
				return ship.ownerid == ownerid && ship.predictedTurn == turn && (freighters == null || plugin.isFreighter(ship) == freighters);
			});
			this.savePredictedShips();
		},

		/**
		 * Remove the stored predicted builds that pass a test; a seen ship one of them was merged into is unmerged
		 * @param test		function (predicted ship) returning true to remove it
		 */
		dropPredictions: function (test) {
			var keep = [];
			var unmerged = false;
			for (var p = 0; p < this.predictedShips.length; p++) {
				var predicted = this.predictedShips[p];
				if (!test(predicted)) {
					keep.push(predicted);
					continue;
				}
				var ship = predicted.mergedShipId != null ? this.getShipById(predicted.mergedShipId) : null;
				if (ship && ship.predictedLoadout) {
					this.clearMergedLoadout(ship);
					unmerged = true;
				}
			}
			this.predictedShips = keep;
			if (unmerged)
				this.saveEnemyShipList();
		},

		/**
		 * Drop the predicted builds that a newly seen ship now accounts for: a ship of the same player and hull, first seen
		 * in or after the build turn and after the prediction was stored. Each seen ship accounts for one predicted build.
		 */
		reconcilePredictions: function () {
			if (this.predictedShips.length == 0)
				return;
			//a ship a predicted build was merged into already accounts for that build
			var used = {};
			for (var u = 0; u < this.enemyShipList.length; u++) {
				if (this.enemyShipList[u].predictedLoadout)
					used[this.enemyShipList[u].id] = true;
			}
			var keep = [];
			for (var p = 0; p < this.predictedShips.length; p++) {
				var predicted = this.predictedShips[p];
				//merged builds are kept with the ship they were merged into
				if (predicted.mergedShipId != null) {
					keep.push(predicted);
					continue;
				}
				var match = null;
				for (var s = 0; s < this.enemyShipList.length && !match; s++) {
					var ship = this.enemyShipList[s];
					var first = this.getSeenTurns(ship).first;
					if (!used[ship.id] && ship.ownerid == predicted.ownerid && ship.hullid == predicted.hullid &&
						first >= predicted.predictedTurn && first > predicted.storedListTurn)
						match = ship;
				}
				if (match)
					used[match.id] = true;
				else
					keep.push(predicted);
			}
			if (keep.length != this.predictedShips.length) {
				this.predictedShips = keep;
				this.savePredictedShips();
			}
		},

		/**
		 * Parts of a loadout that a seen ship does not show: its engine, beams, torpedoes and ammo where unknown
		 * @param ship		seen ship
		 * @param loadout	{engineid, beamid, beams, torpedoid, torps, ammo}, like a predicted ship
		 * @return 			the parts to fill in, by ship field
		 */
		predictedLoadoutFields: function (ship, loadout) {
			var hull = vgap.getHull(ship.hullid);
			var fields = {};
			if (!hull || !loadout)
				return fields;
			if (loadout.engineid > 0 && !(ship.engineid > 0))
				fields.engineid = loadout.engineid;
			if (hull.beams > 0 && loadout.beamid > 0 && loadout.beams > 0 && !(ship.beamid > 0 && ship.beams > 0)) {
				fields.beamid = loadout.beamid;
				fields.beams = loadout.beams;
			}
			if (hull.launchers > 0 && loadout.torpedoid > 0 && loadout.torps > 0 && !(ship.torpedoid > 0 && ship.torps > 0)) {
				fields.torpedoid = loadout.torpedoid;
				fields.torps = loadout.torps;
			}
			if (loadout.ammo > 0 && !(ship.ammo >= 0))
				fields.ammo = loadout.ammo;
			return fields;
		},

		/**
		 * Fill in parts of a ship's loadout from predictedLoadoutFields
		 */
		applyLoadoutFields: function (ship, fields) {
			for (var key in fields)
				ship[key] = fields[key];
		},

		/**
		 * Stored predicted builds a seen ship can be merged with: of the same player and hull, built no later than the
		 * ship was last seen, and not merged into another ship. Not the first sighting: lists from before reused ids were
		 * told apart hold the history of an earlier ship with the same id. Ships of shared players and ships merged before have none.
		 * @return 		indices in predictedShips
		 */
		mergeCandidates: function (ship) {
			if (ship.predicted || ship.predictedLoadout || this.isSharedPlayer(ship.ownerid))
				return [];
			var last = this.getSeenTurns(ship).last;
			var candidates = [];
			for (var p = 0; p < this.predictedShips.length; p++) {
				var predicted = this.predictedShips[p];
				if (predicted.mergedShipId == null && predicted.ownerid == ship.ownerid && predicted.hullid == ship.hullid && (last == null || predicted.predictedTurn <= last))
					candidates.push(p);
			}
			return candidates;
		},

		/**
		 * Merge a predicted build into a seen ship: the ship takes the parts of the predicted loadout it does not show,
		 * marked as predicted. The predicted build stays stored for the build predictor, marked as merged into the ship,
		 * and is no longer listed or counted on its own since the ship accounts for it.
		 * @param index		position of the predicted build in predictedShips
		 */
		mergePrediction: function (shipId, index) {
			var predicted = this.predictedShips[index];
			var ship = this.getShipById(shipId);
			if (!ship || !predicted || predicted.mergedShipId != null)
				return;
			var fields = this.predictedLoadoutFields(ship, predicted);
			ship.predictedLoadout = { turn: predicted.predictedTurn, custom: !!predicted.custom, fields: fields };
			this.applyLoadoutFields(ship, fields);
			predicted.mergedShipId = ship.id;
			this.savePredictedShips();
			this.saveEnemyShipList();
		},

		/**
		 * Drop the predicted parts of a merged ship's loadout, back to unknown as they were not seen
		 */
		clearMergedLoadout: function (ship) {
			var unknown = { engineid: 0, beamid: 0, beams: 0, torpedoid: 0, torps: 0, ammo: -1 };
			for (var key in ship.predictedLoadout.fields)
				ship[key] = unknown[key];
			delete ship.predictedLoadout;
		},

		/**
		 * Undo a merge: the ship loses the predicted parts of its loadout and the predicted build is listed on its own again
		 */
		unmergePrediction: function (shipId) {
			var ship = this.getShipById(shipId);
			if (!ship || !ship.predictedLoadout)
				return;
			var merged = ship.predictedLoadout;
			var stored = null;
			for (var p = 0; p < this.predictedShips.length; p++) {
				if (this.predictedShips[p].mergedShipId == ship.id)
					stored = this.predictedShips[p];
			}
			if (stored) {
				delete stored.mergedShipId;
			} else {
				//merged before merged builds were kept: store the build again from the merged loadout
				var hull = vgap.getHull(ship.hullid);
				stored = new ShipMin();
				delete stored.id;
				stored.name = hull.name;
				stored.ownerid = ship.ownerid;
				stored.hullid = ship.hullid;
				stored.mass = hull.mass;
				stored.engineid = merged.fields.engineid != null ? merged.fields.engineid : (ship.engineid > 0 ? ship.engineid : 0);
				stored.beamid = merged.fields.beamid != null ? merged.fields.beamid : (ship.beamid > 0 ? ship.beamid : 0);
				stored.beams = merged.fields.beams != null ? merged.fields.beams : (ship.beams > 0 ? ship.beams : 0);
				stored.torpedoid = merged.fields.torpedoid != null ? merged.fields.torpedoid : (ship.torpedoid > 0 ? ship.torpedoid : 0);
				stored.torps = merged.fields.torps != null ? merged.fields.torps : (ship.torps > 0 ? ship.torps : 0);
				stored.ammo = merged.fields.ammo != null ? merged.fields.ammo : -1;
				stored.custom = merged.custom;
				stored.damage = -1;
				stored.crew = -1;
				stored.infoturn = merged.turn;
				stored.predicted = true;
				stored.predictedTurn = merged.turn;
				this.predictedShips.push(stored);
			}
			//stored as of now, so the seen ship does not account for it again in reconcilePredictions
			stored.storedListTurn = this.currentListTurn;
			this.clearMergedLoadout(ship);
			this.savePredictedShips();
			this.saveEnemyShipList();
		},

		/**
		 * Redraw the shown view at the same scroll position, as redrawing it otherwise scrolls back to the top
		 */
		refreshKeepScroll: function () {
			var plugin = this;
			//the pane scrolls through jScrollPane, or natively in clients without it: keep both
			var api = this.pane ? this.pane.data("jsp") : null;
			var y = api ? api.getContentPositionY() : 0;
			var paneTop = $(".DashPane", vgap.dash.content).scrollTop() || 0;
			var outer = vgap.dash.content.add(vgap.dash.content.parents()).map(function () { return { el: this, top: this.scrollTop }; }).get();
			var restore = function () {
				for (var o = 0; o < outer.length; o++)
					outer[o].el.scrollTop = outer[o].top;
				$(".DashPane", vgap.dash.content).scrollTop(paneTop);
				var newApi = plugin.pane ? plugin.pane.data("jsp") : null;
				if (newApi && y > 0)
					newApi.scrollToY(y);
			};
			this.showEnemyShipsView(this.view);
			restore();
			//again once the page has laid out
			setTimeout(restore, 0);
		},

		/**
		 * Html of the merge control of a seen ship in the ship lists: a button to merge it with its predicted build (a
		 * choice of builds when several match), or to undo a merge
		 */
		mergeControlHtml: function (ship) {
			var call = "vgap.plugins[\"enemyShipListPlugin\"]";
			var refresh = call + ".refreshKeepScroll();";
			if (ship.predictedLoadout) {
				return " <button type='button' class='TestButton' title='Undo the merge: drop the predicted loadout and list the predicted build of turn " + ship.predictedLoadout.turn +
					" on its own again' onMouseDown='event.preventDefault();' onClick='event.stopPropagation(); " + call + ".unmergePrediction(" + ship.id + "); " + refresh + "'>Unmerge</button>";
			}
			var candidates = this.mergeCandidates(ship);
			if (candidates.length == 0)
				return "";
			var plugin = this;
			var label = function (p) {
				var predicted = plugin.predictedShips[p];
				return "Turn " + predicted.predictedTurn + ": " + plugin.predictedBuildText([predicted]).replace(/^1x /, "");
			};
			var title = "Merge with a predicted build: the ship is that build, and takes the parts of its loadout not seen, marked as predicted";
			if (candidates.length == 1) {
				return " <button type='button' class='TestButton' title='" + title + " (" + label(candidates[0]) + ")' onMouseDown='event.preventDefault();' " +
					"onClick='event.stopPropagation(); " + call + ".mergePrediction(" + ship.id + ", " + candidates[0] + "); " + refresh + "'>Merge</button>";
			}
			var html = " <select title='" + title + "' onclick='event.stopPropagation();' " +
				"onchange='if (this.value !== \"\") { " + call + ".mergePrediction(" + ship.id + ", parseInt(this.value, 10)); " + refresh + " }'>" +
				"<option value=''>Merge...</option>";
			for (var c = 0; c < candidates.length; c++)
				html += "<option value='" + candidates[c] + "'>" + label(candidates[c]) + "</option>";
			return html + "</select>";
		},

		/**
		 * Save the predicted builds to local storage
		 */
		savePredictedShips: function () {
			if (!this.enabled)
				return;
			try {
				localStorage.setItem(this.storage_path + "predicted", JSON.stringify(this.predictedShips));
			} catch (err) {
				console.log("EnemyShipListPlugin: Not enough localStorage space to save the predicted builds.");
			}
		},

		/**
		 * Text of a predicted build: identical ships once with a count
		 */
		predictedBuildText: function (ships) {
			var groups = [];
			var byKey = {};
			for (var s = 0; s < ships.length; s++) {
				var ship = ships[s];
				var key = this.predictionKey([ship]);
				if (!byKey[key]) {
					var parts = [];
					if (ship.engineid > 0 && vgap.getEngine(ship.engineid))
						parts.push(vgap.getEngine(ship.engineid).name);
					if (ship.beamid > 0 && vgap.getBeam(ship.beamid))
						parts.push(vgap.getBeam(ship.beamid).name);
					if (ship.torpedoid > 0 && vgap.getTorpedo(ship.torpedoid))
						parts.push(vgap.getTorpedo(ship.torpedoid).name);
					byKey[key] = { name: vgap.getHull(ship.hullid).name + (parts.length > 0 ? " (" + parts.join(", ") + ")" : ""), count: 0 };
					groups.push(byKey[key]);
				}
				byKey[key].count++;
			}
			return groups.map(function (g) { return g.count + "x " + g.name; }).join(", ") + (ships.some(function (ship) { return ship.custom; }) ? " (custom)" : "");
		},

		/**
		 * Text naming the seen ships a predicted build was merged into, empty if none
		 */
		mergedBuildNote: function (ships) {
			var ids = ships.filter(function (ship) { return ship.mergedShipId != null; }).map(function (ship) { return "#" + ship.mergedShipId; });
			return ids.length > 0 ? " (merged into ship" + (ids.length == 1 ? " " : "s ") + ids.join(", ") + ")" : "";
		},

		/**
		 * Html table row of a predicted build in the ship lists, with the columns of a seen ship and marked as predicted
		 */
		predictedShipRowHtml: function (ship) {
			var hull = vgap.getHull(ship.hullid);
			var player = vgap.getPlayer(ship.ownerid);
			var race = vgap.getRace(player.raceid);
			var td = "<td style='color:" + this.colorsA[ship.ownerid] + "; font-style:italic;'>";
			var beams = hull.beams == 0 ? "---" : (ship.beams > 0 && ship.beamid > 0 ? ship.beams + " " + vgap.getBeam(ship.beamid).name : "?");
			var secondary = "---";
			if (hull.fighterbays > 0)
				secondary = hull.fighterbays + " Fighter " + (hull.fighterbays == 1 ? "Bay" : "Bays");
			else if (hull.launchers > 0)
				secondary = ship.torps > 0 && ship.torpedoid > 0 ? ship.torps + " " + vgap.getTorpedo(ship.torpedoid).name + (ship.torps == 1 ? " Tube" : " Tubes") : "?";
			var html = "<tr title='" + (ship.starting ? "Freighter every player starts with, not seen yet" : "Predicted build of turn " + ship.predictedTurn + ", chosen in the build predictor") + "'>";
			html += "<td title='Player slot " + ship.ownerid + "' style='color:" + this.colorsA[ship.ownerid] + "; font-style:italic;'>" + player.username + "</td>";
			html += td + race.shortname + "</td>";
			html += td + "?</td>";
			html += "<td title='" + hull.name + "'><img class='TinyIcon' src='" + hullImg(ship.hullid) + "' style='opacity:0.6'/><div style='display: none;'>" + hull.name + "</div></td>";
			html += td + (ship.starting ? "Starting freighter: " : ship.custom ? "Predicted (custom): " : "Predicted: ") + hull.name + "</td>";
			if (this.enableEdit && ship.starting)
				html += "<td></td>";
			else if (this.enableEdit)
				html += "<td><button type='button' class='TestButton' onClick='vgap.plugins[\"enemyShipListPlugin\"].removePrediction(" + ship.ownerid + ", " + ship.predictedTurn + "); " +
					"vgap.plugins[\"enemyShipListPlugin\"].showEnemyShipsView(" + this.view + ");'> Delete </button></td>";
			html += td + ship.predictedTurn + (ship.starting ? " (start)" : " (predicted)") + "</td>";
			html += td + "?</td>";
			html += td + (ship.engineid > 0 && vgap.getEngine(ship.engineid) ? vgap.getEngine(ship.engineid).name : "?") + "</td>";
			html += td + beams + "</td>";
			html += td + secondary + "</td>";
			html += td + "?</td>";
			html += td + hull.mass + "</td>";
			html += td + "?</td>";
			html += td + "?</td>";
			html += "</tr>";
			return html;
		},

		/**
		 * Names of the usual starting freighter: the one ship every player builds on turn 1 appears on turn 2, and
		 * as a freighter it is a Large Deep Space Freighter with Transwarp engines (146 of 169 in complete games)
		 * @return 		{hull, engine} names, {hullItem, engineItem} the hull and engine (null if missing)
		 */
		getStarterFreighter: function () {
			var hull = null;
			for (var h = 0; h < vgap.hulls.length; h++) {
				if (/large deep space freighter/i.test(vgap.hulls[h].name))
					hull = vgap.hulls[h];
			}
			var engine = null;
			for (var e = 0; e < vgap.engines.length; e++) {
				if (/transwarp/i.test(vgap.engines[e].name))
					engine = vgap.engines[e];
			}
			return { hull: hull ? hull.name : "Large Deep Space Freighter", engine: engine ? engine.name : "Transwarp Drive", hullItem: hull, engineItem: engine };
		},

		/**
		 * Html for the build estimate section above the score changes and ship summary
		 * @param player	selected player
		 * @param history	result of getBuildHistory
		 */
		buildEstimatorHtml: function (player, history) {
			var plugin = vgap.plugins["enemyShipListPlugin"];
			var color = plugin.colorsA[player.id];

			var buildTurns = history.turns.filter(function (row) { return row.newCapitals > 0 || row.newFreighters > 0; });
			var html = "<h3>Build estimate</h3>";
			//the manual build calculator is filled in by buildManualCalculator once the page is rendered
			var manual = "<div><h4>Manual build</h4><div id='BuildPredictManual'></div></div>";
			plugin.manualTarget = null;
			plugin.manualTurn = null;
			if (buildTurns.length == 0) {
				return html + "<p>No turns with new warships or freighters in the score history.</p>" + manual;
			}

			var row = buildTurns[0];
			for (var i = 0; i < buildTurns.length; i++) {
				if (buildTurns[i].turn == plugin.estimateTurn)
					row = buildTurns[i];
			}

			var shipCounts = function (r) {
				var parts = [];
				if (r.newCapitals > 0)
					parts.push("+" + r.newCapitals + " warship" + (r.newCapitals == 1 ? "" : "s"));
				if (r.newFreighters > 0)
					parts.push("+" + r.newFreighters + " freighter" + (r.newFreighters == 1 ? "" : "s"));
				return parts.join(", ");
			};

			html += "<p>Turn: <select onChange='vgap.plugins[\"enemyShipListPlugin\"].estimateTurn = parseInt(this.options[this.selectedIndex].value, 10); vgap.plugins[\"enemyShipListPlugin\"].showEnemyShipsView(8);'>";
			for (var i = 0; i < buildTurns.length; i++) {
				html += "<option value='" + buildTurns[i].turn + "'" + (buildTurns[i] == row ? " selected='selected'" : "") + ">" +
					plugin.formatTurnRange(buildTurns[i]) + " (" + shipCounts(buildTurns[i]) + ")" +
					(plugin.getPredictedBuild(player.id, buildTurns[i].turn).length > 0 ? " - predicted" : "") + "</option>";
			}
			html += "</select> " + row.newCapitals + " new warship" + (row.newCapitals == 1 ? "" : "s") + ", " +
				row.newFreighters + " new freighter" + (row.newFreighters == 1 ? "" : "s") + ", military" + plugin.formatChange(row.militaryChange) + "</p>";
			html += plugin.mineChangeHtml(row, color);

			//the one ship every player builds on turn 1 appears on turn 2
			var unknownFreighters = row.newFreighters;
			if (row.fromTurn <= 2 && row.turn >= 2) {
				html += "<p style='color:" + color + "'>Starting build: every player starts with a Medium Deep Space Freighter with Transwarp engines, " +
					"listed as a starting freighter until it is seen, and builds one ship on turn 1, which appears on turn 2.";
				if (row.newFreighters > 0) {
					var starter = plugin.getStarterFreighter();
					html += " Likely starting freighter: 1x " + starter.hull + " with " + starter.engine + " engines (146 of the 169 starting freighters in complete games).";
					if (plugin.getPredictedBuild(player.id, row.turn, true).length == 0 && starter.hullItem)
						html += " <button type='button' class='TestButton' title='Store as a predicted build of this turn' " +
							"onMouseDown='event.preventDefault();' onClick='vgap.plugins[\"enemyShipListPlugin\"].storeStarterFreighter(" + player.id + ", " + row.turn + ");'>Use</button>";
					unknownFreighters--;
				}
				html += "</p>";
			}
			//the predicted build stored for this turn, listed with the ships seen
			var storedBuild = plugin.getPredictedBuild(player.id, row.turn);
			if (storedBuild.length > 0) {
				html += "<p style='color:" + color + "'>Predicted build stored for this turn, listed with the ships seen until a matching ship is seen: " +
					plugin.predictedBuildText(storedBuild) +
					plugin.mergedBuildNote(storedBuild) +
					" <button type='button' class='TestButton' onMouseDown='event.preventDefault();' onClick='vgap.plugins[\"enemyShipListPlugin\"].removePrediction(" + player.id + ", " + row.turn + "); vgap.plugins[\"enemyShipListPlugin\"].refreshKeepScroll();'>Remove</button></p>";
			}
			if (unknownFreighters > 0) {
				html += "<p>" + unknownFreighters + " freighter" + (unknownFreighters == 1 ? "" : "s") + " built. Freighters do not count toward the military score, so their hulls cannot be estimated.</p>";
			}

			plugin.manualTarget = row.buildChange;
			plugin.manualTurn = row.turn;

			//predicted configurations on the left, manual build on the right
			html += "<div style='display:flex; flex-wrap:wrap; align-items:flex-start; gap:32px;'><div>";
			if (!(row.newCapitals > 0)) {
				html += "<p>No new warships this turn.</p>";
				var builds = plugin.estimateStarbaseBuilds(player.id, [], row.buildChange, row.turn);
				if (builds) {
					html += "<p style='color:" + color + "'>Starbase builds that make up the military change:<br>" + plugin.starbaseBuildsText(builds) +
						"<br>Total " + Math.round(builds.value) + plugin.formatChange(Math.round(builds.value - row.buildChange)) + "</p>";
				}
			} else if (!(row.buildChange > 0)) {
				html += "<p>The military score did not rise this turn" + (row.mines ? " once the minefields are taken out" : "") +
					", so the new ships cannot be estimated (losses hide their value).</p>";
			} else {
				html += plugin.buildEstimateTableHtml(player.id, row, color);
			}
			html += "</div>" + manual + "</div>";
			return html;
		},

		/**
		 * Html for the tables of ship configurations that could explain a turn's military score change:
		 * the likeliest ones, led by the predicted build stored for the turn
		 * @param ownerid	player id
		 * @param row		turn row from getBuildHistory
		 * @param color		player color
		 */
		buildEstimateTableHtml: function (ownerid, row, color) {
			var plugin = this;
			var buildPhase = plugin.getBuildPhase(row.turn);
			var fill = buildPhase.fill;
			var html = "<p style='color:#AAAAAA'>Phase: " + buildPhase.phase.name +
				(fill != null ? " (" + Math.round(fill * 100) + "% of the ship limit in use)" : " (ship count unknown)") + ".</p>";
			//once the limit is reached builds come from priority points and are too varied to estimate
			if (buildPhase.key == "afterCap")
				return html + "<p>The ship limit was reached before this turn, so builds are not estimated automatically. Use the manual build to test a configuration.</p>";

			var estimate = plugin.estimateBuilds(ownerid, row.newCapitals, row.buildChange, row.turn);
			html += plugin.seenPlayerHtml(estimate);
			if (estimate.focus.length > 0) {
				html += "<p style='color:#AAAAAA'>Usual builds of this race in this phase: " + estimate.focus.slice(0, 5).map(function (f) {
					return f.hull.name + " (" + plugin.getShipRole(f.hull) + ", " + Math.round(f.share * 100) + "%)";
				}).join(", ") + ".</p>";
			}
			if (estimate.ranked.length == 0)
				return html + "<p>No set of " + row.newCapitals + " warship" + (row.newCapitals == 1 ? "" : "s") + " of this race fits a military change this small.</p>";
			//the starbase builds that make up the rest of the change
			var addStarbase = function (results) {
				for (var r = 0; r < results.length; r++)
					results[r].starbase = plugin.estimateStarbaseBuilds(ownerid, results[r].ships, -results[r].diff, row.turn);
			};
			//the predicted build stored for the turn leads the list, marked as predicted; a stored build the estimate did not
			//list (a manual build) is added
			var results = estimate.ranked;
			var storedShips = plugin.getPredictedBuild(ownerid, row.turn, false);
			var stored = plugin.predictionKey(storedShips);
			if (storedShips.length > 0) {
				var match = results.filter(function (r) { return plugin.resultKey(r) == stored; });
				var others = results.filter(function (r) { return plugin.resultKey(r) != stored; });
				results = (match.length > 0 ? match : [plugin.predictedResult(storedShips, row.buildChange)]).concat(others);
			}
			addStarbase(results);
			//kept for the Use buttons, which store a configuration as the predicted build of the turn
			plugin.estimateCandidates = { ownerid: ownerid, turn: row.turn, ranked: results };
			html += plugin.accuracyTableHtml(buildPhase.key);
			html += "<h4>Predicted builds</h4>";
			html += plugin.buildConfigTableHtml(results, color, stored, ownerid, row.turn);
			return html;
		},

		/**
		 * Html line flagging whether warships of the player were seen, which the estimate leans on, and the chance that
		 * the hulls built are among the listed builds
		 * @param estimate	result of estimateBuilds
		 */
		seenPlayerHtml: function (estimate) {
			var seen = estimate.seen;
			var text = seen.fleet + seen.fresh > 0 ?
				"<span style='color:#33CC33; font-weight:bold;'>Seen player</span>: " + seen.fleet + " warship" + (seen.fleet == 1 ? "" : "s") + " seen before this turn" +
				(seen.fresh > 0 ? ", " + seen.fresh + " first seen this turn or the next (likely the new builds)" : "") + "." :
				"<span style='color:#FFA500; font-weight:bold;'>Unseen player</span>: no warships of this player seen yet, so the estimate rests on the race's usual builds.";
			if (estimate.ranked.length > 0)
				text += " Chance the hulls built are listed: " + this.formatConfidence(estimate.listed) + ".";
			return "<p>" + text + "</p>";
		},

		/**
		 * Version of the build estimate: a hash of the code and values in estimateModelParts, whitespace left out, so any
		 * change to the estimate gives a new version. estimateAccuracy holds the version its values were measured on.
		 * @return 		8 hex digits
		 */
		getModelVersion: function () {
			var text = "";
			for (var i = 0; i < this.estimateModelParts.length; i++) {
				var part = this[this.estimateModelParts[i]];
				text += this.estimateModelParts[i] + ":" + (typeof part == "function" ? part.toString() : JSON.stringify(part)) + ";";
			}
			text = text.replace(/\s+/g, "");
			//32 bit FNV-1a
			var hash = 0x811c9dc5;
			for (var c = 0; c < text.length; c++)
				hash = Math.imul(hash ^ text.charCodeAt(c), 0x01000193) >>> 0;
			return ("0000000" + hash.toString(16)).slice(-8);
		},

		/**
		 * Title of a phase by the share of the ship limit in use where it starts and ends, e.g. "25-50% Ship Limit"
		 * @param phaseKey	key of estimatePhases
		 * @return 			title, null for an unknown key
		 */
		getPhaseLabel: function (phaseKey) {
			var opening = Math.round(100 * this.estimateOpeningFill), early = Math.round(100 * this.estimateEarlyFill);
			var range = { opening: "<" + opening + "%", early: opening + "-" + early + "%", nearCap: early + "-100%", afterCap: "100%" }[phaseKey];
			return range ? range + " Ship Limit" : null;
		},

		/**
		 * Html table of how often the build estimate was right on complete games (estimateAccuracy), by phase, with the
		 * model version it was measured on, flagged if the estimate changed since
		 * @param phaseKey	phase of the shown turn, highlighted
		 */
		accuracyTableHtml: function (phaseKey) {
			var accuracy = this.estimateAccuracy;
			if (!accuracy || !accuracy.phases)
				return "";
			var top = this.estimateResults;
			var html = "<table class='BuildPredictTable' border='0'><thead><tr>" +
				"<th title='Build turns before the ship limit in complete games, each predicted without that game in the race builds'>Accuracy on complete games</th><th>Turns</th>" +
				"<th title='The hulls with the engines, beams and torpedoes built are among the " + top + " listed builds'>Correct hulls and loadout</th>" +
				"<th title='The top build has the hulls built'>Correct hulls in top 1</th>" +
				"<th title='The hulls built are among the " + top + " listed builds'>Correct hulls in top " + top + "</th>" +
				"</tr></thead><tbody>";
			var rows = [["opening",this.getPhaseLabel("opening")], ["early", this.getPhaseLabel("early")], ["nearCap", this.getPhaseLabel("nearCap")]];
			for (var r = 0; r < rows.length; r++) {
				var row = accuracy.phases[rows[r][0]];
				if (!row)
					continue;
				html += "<tr" + (rows[r][0] == phaseKey ? " style='font-weight:bold;' title='Phase of this turn'" : "") + ">" +
					"<td>" + this.escapeHtml(rows[r][1]) + "</td><td>" + row.turns + "</td><td>" + row.loadout + "%</td><td>" + row.top1 + "%</td><td>" + row.listed + "%</td></tr>";
			}
			html += "</tbody></table>";
			html += "<p style='color:#AAAAAA'>Model version " + accuracy.version + " (" + accuracy.model + "), measured " + accuracy.date + " on " + accuracy.games + " complete games.";
			var current = this.getModelVersion();
			if (current != accuracy.model)
				html += " <span style='color:#FFA500'>The build estimate has changed since (now " + current + "), so these values may be out of date.</span>";
			return html + "</p>";
		},

		/**
		 * Confidence as a percentage, colored from red (unlikely) to green (likely)
		 */
		formatConfidence: function (p) {
			var color = p >= 0.5 ? "#33CC33" : p >= 0.2 ? "#FFD700" : p >= 0.05 ? "#FFA500" : "#FF4040";
			return "<span style='color:" + color + "; font-weight:bold;'>" + (p >= 0.995 ? ">99" : p < 0.01 ? "<1" : Math.round(p * 100)) + "%</span>";
		},

		/**
		 * Html line with the military change from the minefields seen in a turn, which the build estimate leaves out
		 * @param row	turn row from getBuildHistory
		 * @param color	player color
		 */
		mineChangeHtml: function (row, color) {
			var mines = row.mines;
			if (!mines)
				return "";
			var html = "<p style='color:" + color + "'>Minefields seen: " + mines.fields + " field" + (mines.fields == 1 ? "" : "s") + ", " +
				(mines.units >= 0 ? "+" : "") + mines.units + " mine units";
			if (mines.laid > 0)
				html += " (" + mines.laid + " laid" + (mines.torpedo ? ", likely from " + mines.torpedo.name + " torpedoes worth " + Math.round(mines.torpedoes) + " military" : "") + ")";
			html += ", military" + this.formatChange(Math.round(mines.value)) + ". Left for builds:" + this.formatChange(row.buildChange) + "</p>";
			return html;
		},

		/**
		 * Html table of ship configurations, identical ships listed once with a count, with the starbase builds
		 * that make up the rest of the military change
		 * @param results	[{ships, value, diff, starbase}] from estimateBuilds, starbase from estimateStarbaseBuilds;
		 * 					the Use buttons store results[i] of estimateCandidates.ranked
		 * @param color		player color
		 * @param stored	predictionKey of the stored predicted build of the turn, marked as predicted
		 * @param ownerid	player id and turn of the build, for the button that removes the stored build
		 * @param turn
		 */
		buildConfigTableHtml: function (results, color, stored, ownerid, turn) {
			var plugin = this;
			var html = "<table class='BuildPredictTable' border='0'><thead><tr>" +
				"<th></th><th title='Chance these hulls are the ones built, from how often such estimates were right in complete games'>Confidence</th>" +
				"<th>Ships</th><th>Engine</th><th>Beams</th><th>Torpedoes</th><th>Ships Military</th><th>Starbase Builds</th><th>Difference</th>" +
				"</tr></thead><tbody>";
			for (var r = 0; r < results.length; r++) {
				//identical ships are listed once with a count, one line per kind of ship
				var groups = [];
				var byKey = {};
				for (var s = 0; s < results[r].ships.length; s++) {
					var ship = results[r].ships[s];
					var key = ship.hull.id + "|" + ship.engine.id + "|" + (ship.beam ? ship.beam.id : 0) + "|" + (ship.torpedo ? ship.torpedo.id : 0);
					if (!byKey[key]) {
						byKey[key] = { ship: ship, count: 0 };
						groups.push(byKey[key]);
					}
					byKey[key].count++;
				}
				var column = function (text) { return "<td>" + groups.map(text).join("<br>") + "</td>"; };
				var predicted = plugin.resultKey(results[r]) == stored;
				var use = predicted ?
					"<td style='font-weight:bold; white-space:nowrap;' title='The predicted build of this turn, listed with the ships seen'>Predicted" +
					(results[r].custom ? " (custom)" : "") + " <button type='button' class='TestButton' " +
					"onMouseDown='event.preventDefault();' onClick='vgap.plugins[\"enemyShipListPlugin\"].removePrediction(" + ownerid + ", " + turn + ", false); vgap.plugins[\"enemyShipListPlugin\"].refreshKeepScroll();'>Remove</button></td>" :
					"<td><button type='button' class='TestButton' title='Store as the predicted build of this turn' " +
					"onMouseDown='event.preventDefault();' onClick='vgap.plugins[\"enemyShipListPlugin\"].storePrediction(" + r + ");'>Use</button></td>";
				html += "<tr style='color:" + color + (predicted ? "; background:rgba(255,255,255,0.12); font-style:italic;" : "") + "'>" + use +
					"<td>" + (results[r].confidence != null ? plugin.formatConfidence(results[r].confidence) : "---") + "</td>" +
					column(function (g) { return g.count + "x " + g.ship.hull.name; }) +
					column(function (g) { return g.ship.engine.name; }) +
					column(function (g) { return g.ship.beam ? g.ship.beam.name : "---"; }) +
					column(function (g) { return g.ship.torpedo ? g.ship.torpedo.name : "---"; }) +
					"<td>" + results[r].value + "</td>" +
					"<td>" + plugin.starbaseBuildsText(results[r].starbase) + "</td>" +
					"<td>" + plugin.formatChange(Math.round(results[r].diff + (results[r].starbase ? results[r].starbase.value : 0))) + "</td>" +
					"</tr>";
			}
			html += "</tbody></table>";
			return html;
		},

		/**
		 * Fill the manual build calculator: pick a hull, components, ammo, number of ships and starbase builds and see
		 * the military score it adds, compared to the selected turn's military score change.
		 * Changing values updates the result in place; changing the hull rebuilds the calculator.
		 * @param ownerid	player id
		 */
		buildManualCalculator: function (ownerid) {
			var plugin = vgap.plugins["enemyShipListPlugin"];
			var container = $("#BuildPredictManual");
			if (container.length == 0)
				return;
			container.empty();

			//keep the last choices while the same player is shown; start with the most likely build
			var state = plugin.manualBuild;
			if (!state || state.ownerid != ownerid || !vgap.getHull(state.hullid)) {
				var priors = plugin.getBuildPriors(ownerid, vgap.game.turn + 1);
				var first = function (list, fallback) { return list.length > 0 ? list[0].item : fallback; };
				var hull = first(priors.hulls, vgap.hulls[0]);
				state = {
					ownerid: ownerid, hullid: hull.id,
					engineid: first(priors.engines, vgap.engines[0]).id,
					beamid: first(priors.beams, vgap.beams[0]).id, beams: hull.beams,
					torpedoid: first(priors.torpedos, vgap.torpedos[0]).id, launchers: hull.launchers,
					ammo: 0, count: 1, baseFighters: 0, baseDefense: 0, planetDefense: 0
				};
				plugin.manualBuild = state;
			}
			var hull = vgap.getHull(state.hullid);

			var makeSelect = function (items, selectedId) {
				var select = $("<select></select>");
				for (var i = 0; i < items.length; i++) {
					if (items[i] == null) {
						$("<option disabled='disabled'>-----------</option>").appendTo(select);
						continue;
					}
					$("<option></option>").val(items[i].id).text(items[i].name).prop("selected", items[i].id == selectedId).appendTo(select);
				}
				return select;
			};
			var makeNumber = function (value, max) {
				var input = $("<input type='number' min='0' style='width:50px;'>").val(value);
				if (max != null)
					input.attr("max", max);
				return input;
			};

			//the player's own hulls first, then all others
			var race = vgap.getRace(vgap.getPlayer(ownerid).raceid);
			var raceHullIds = race.hulls ? race.hulls.split(",").map(function (id) { return parseInt(id, 10); }) : [];
			var hullList = [];
			for (var h = 0; h < raceHullIds.length; h++) {
				if (vgap.getHull(raceHullIds[h]))
					hullList.push(vgap.getHull(raceHullIds[h]));
			}
			hullList.push(null);
			for (var h = 0; h < vgap.hulls.length; h++) {
				if (raceHullIds.indexOf(vgap.hulls[h].id) < 0)
					hullList.push(vgap.hulls[h]);
			}

			var hullSelect = makeSelect(hullList, state.hullid);
			var engineSelect = makeSelect(vgap.engines, state.engineid);
			var beamSelect = makeSelect(vgap.beams, state.beamid);
			var beamCount = makeNumber(state.beams, hull.beams);
			var torpedoSelect = makeSelect(vgap.torpedos, state.torpedoid);
			var launcherCount = makeNumber(state.launchers, hull.launchers);
			var ammoCount = makeNumber(state.ammo);
			var shipCount = makeNumber(state.count);
			var baseFighters = makeNumber(state.baseFighters || 0, 60);
			var baseDefense = makeNumber(state.baseDefense || 0, 200);
			var planetDefense = makeNumber(state.planetDefense || 0);

			//choices on the left, the military score they add on the right
			var layout = $("<div style='display:flex; flex-wrap:wrap; align-items:flex-start; gap:24px;'></div>").appendTo(container);
			var table = $("<table class='BuildPredictTable' border='0'></table>").appendTo(layout);
			var costs = $("<div></div>").appendTo(layout);
			var addRow = function (label, controls) {
				var tr = $("<tr></tr>").appendTo(table);
				$("<td></td>").text(label).appendTo(tr);
				var td = $("<td></td>").appendTo(tr);
				for (var c = 0; c < controls.length; c++)
					td.append(controls[c]).append(" ");
				return tr;
			};
			addRow("Hull", [hullSelect]);
			addRow("Engines (" + hull.engines + "x)", [engineSelect]);
			if (hull.beams > 0)
				addRow("Beams (max " + hull.beams + ")", [beamCount, beamSelect]);
			if (hull.launchers > 0) {
				addRow("Launchers (max " + hull.launchers + ")", [launcherCount, torpedoSelect]);
				addRow("Loaded torpedoes", [ammoCount]);
			} else if (hull.fighterbays > 0) {
				addRow("Loaded fighters (" + hull.fighterbays + " bays)", [ammoCount]);
			}
			addRow("Number of ships", [shipCount]);
			addRow("Starbase fighters", [baseFighters]);
			addRow("Starbase defense posts", [baseDefense]);
			addRow("Planetary defense posts", [planetDefense]);

			var result = $("<table class='BuildPredictTable' border='0'></table>").appendTo(costs);
			//the manual build can be stored as a custom predicted build of the turn shown in the build estimate
			if (plugin.manualTurn != null) {
				$("<button type='button' class='TestButton' style='margin-top:8px;' title='Store these ships as the predicted build of the turn, listed with the ships seen'></button>")
					.text("Use as predicted build of turn " + plugin.manualTurn)
					.on("mousedown", function (e) { e.preventDefault(); })
					.on("click", function () { plugin.storeManualPrediction(); })
					.appendTo(costs);
			}

			var update = function () {
				var clamp = function (input, max) {
					var value = Math.max(0, parseInt(input.val(), 10) || 0);
					return max != null ? Math.min(value, max) : value;
				};
				state.engineid = parseInt(engineSelect.val(), 10);
				state.beamid = parseInt(beamSelect.val(), 10);
				state.beams = hull.beams > 0 ? clamp(beamCount, hull.beams) : 0;
				state.torpedoid = parseInt(torpedoSelect.val(), 10);
				state.launchers = hull.launchers > 0 ? clamp(launcherCount, hull.launchers) : 0;
				state.ammo = (hull.launchers > 0 || hull.fighterbays > 0) ? clamp(ammoCount) : 0;
				state.count = clamp(shipCount);
				state.baseFighters = clamp(baseFighters, 60);
				state.baseDefense = clamp(baseDefense, 200);
				state.planetDefense = clamp(planetDefense);

				var engine = vgap.getEngine(state.engineid);
				var beam = vgap.getBeam(state.beamid);
				var torpedo = vgap.getTorpedo(state.torpedoid);
				var parts = [
					["Hull", plugin.partValue(hull, "cost")],
					["Engines", hull.engines * plugin.partValue(engine, "cost")],
					["Beams", state.beams * plugin.partValue(beam, "cost")],
					["Launchers", state.launchers * plugin.partValue(torpedo, "launchercost")],
					//loaded ammo: torpedoes 1 point per megacredit, fighters 125 each
					[hull.fighterbays > 0 ? "Fighters" : "Torpedoes", hull.fighterbays > 0 ? state.ammo * 125 : state.ammo * (torpedo ? torpedo.torpedocost : 0)]
				];
				//freighters do not count toward the military score
				var warship = !plugin.isFreighterHull(hull);
				var perShip = 0;
				result.empty();
				for (var p = 0; p < parts.length; p++) {
					if (parts[p][1] == 0)
						continue;
					perShip += parts[p][1];
					$("<tr><td></td><td></td></tr>").appendTo(result).children().first().text(parts[p][0]).next().text(parts[p][1]);
				}
				if (!warship)
					perShip = 0;
				//starbase builds: 62.5 per starbase fighter, 7.5 per starbase defense post, 5.5 per planetary defense post
				var starbase = 62.5 * state.baseFighters + 7.5 * state.baseDefense + 5.5 * state.planetDefense;
				var total = perShip * state.count + starbase;
				$("<tr><td><strong>Per ship</strong></td><td><strong>" + perShip + "</strong></td></tr>").appendTo(result);
				$("<tr><td>Ships (" + state.count + "x)</td><td>" + perShip * state.count + "</td></tr>").appendTo(result);
				if (starbase > 0)
					$("<tr><td>Starbase builds</td><td>" + starbase + "</td></tr>").appendTo(result);
				$("<tr><td><strong>Total</strong></td><td><strong>" + total + "</strong></td></tr>").appendTo(result);
				if (!warship)
					$("<tr><td colspan='2'>Freighters do not count toward the military score.</td></tr>").appendTo(result);
				if (plugin.manualTarget != null) {
					$("<tr><td>Turn military change</td><td>" + plugin.manualTarget + "</td></tr>").appendTo(result);
					$("<tr><td>Difference</td><td>" + plugin.formatChange(Math.round(total - plugin.manualTarget)) + "</td></tr>").appendTo(result);
				}
			};

			hullSelect.on("change", function () {
				//a new hull resets the counts to its full loadout
				var newHull = vgap.getHull(parseInt(hullSelect.val(), 10));
				state.hullid = newHull.id;
				state.beams = newHull.beams;
				state.launchers = newHull.launchers;
				state.ammo = 0;
				plugin.buildManualCalculator(ownerid);
				var api = plugin.pane ? plugin.pane.data("jsp") : null;
				if (api)
					api.reinitialise();
			});
			container.find("select, input").not(hullSelect).on("change input", update);
			//keep typing in the calculator from reaching the NU hotkeys
			container.find("select, input").on("keydown", function (e) { e.stopPropagation(); });

			update();
		},

		/**
		 * Get the first and last turn a ship was seen
		 * @param ship	ship
		 * @return 		{first, last}
		 */
		getSeenTurns: function (ship) {
			var first = null;
			var last = null;
			var keyList = ship.history ? Object.keys(ship.history) : [];
			for (var k = 0; k < keyList.length; k++) {
				var turn = parseInt(keyList[k], 10);
				if (isNaN(turn))
					continue;
				if (first == null || turn < first)
					first = turn;
				if (last == null || turn > last)
					last = turn;
			}
			//ships without history (e.g. added manually) only have their last sighting
			var infoturn = parseInt(ship.infoturn, 10);
			if (first == null) {
				first = infoturn;
				last = infoturn;
			}
			return { first: first, last: Math.max(last, infoturn) };
		},

		/**
		 * Get the recorded scoreboard of a player per turn with the change against the previous
		 * recorded turn, the military change from the minefields seen (mines) and the rest left for builds (buildChange),
		 * and the known ships of that player with their first and last sighting
		 * @param ownerid	player id
		 * @return 			{turns (newest first), ships (by id)}
		 */
		getBuildHistory: function (ownerid) {
			//turn -> score history entry of the player
			var entries = {};
			var turnKeys = Object.keys(this.scoreHistory);
			for (var k = 0; k < turnKeys.length; k++) {
				var turn = parseInt(turnKeys[k], 10);
				if (!isNaN(turn) && this.scoreHistory[turnKeys[k]][ownerid] && !this.isPlaceholderScores(this.scoreHistory[turnKeys[k]])) {
					entries[turn] = this.scoreHistory[turnKeys[k]][ownerid];
				}
			}
			//a missing turn before a recorded one follows from the changes the scoreboard shows. The changes against
			//turn 1 are against its empty scoreboard, so turn 1 is the start of the game instead.
			var known = Object.keys(entries).map(function (t) { return parseInt(t, 10); });
			for (var k = 0; k < known.length; k++) {
				var now = entries[known[k]];
				if (known[k] > 2 && !entries[known[k] - 1] && now.dm != null) {
					entries[known[k] - 1] = { c: now.c - now.dc, f: now.f - now.df, m: now.m - now.dm, s: now.s - now.ds };
				}
			}
			if (entries[2])
				entries[1] = { c: 0, f: 1, m: this.startMilitary, start: true };
			var recorded = Object.keys(entries).map(function (t) { return parseInt(t, 10); });
			recorded.sort(function (a, b) { return a - b; });

			var ships = [];
			var known = this.getKnownShips();
			for (var s = 0; s < known.length; s++) {
				var ship = known[s];
				//support for sphere addon: ignore ships with negative id
				if (ship.ownerid != ownerid || ship.id < 0)
					continue;
				var seen = this.getSeenTurns(ship);
				ships.push({ ship: ship, type: this.isFreighter(ship) ? "freighter" : "capital", firstSeen: seen.first, lastSeen: seen.last, predicted: !!ship.predicted });
			}
			//seen ships by id, then predicted builds by turn
			ships.sort(function (a, b) {
				if (a.predicted != b.predicted)
					return a.predicted ? 1 : -1;
				return a.predicted ? a.firstSeen - b.firstSeen : parseInt(a.ship.id, 10) - parseInt(b.ship.id, 10);
			});

			//a rise in warships or freighters means at least that many were built (losses in the same turn hide builds)
			var turns = [];
			for (var r = 0; r < recorded.length; r++) {
				var now = entries[recorded[r]];
				var row = { turn: recorded[r], fromTurn: recorded[r], score: now.s, military: now.m, capitals: now.c, freighters: now.f, firstSeen: [] };
				if (r > 0) {
					var prev = entries[recorded[r - 1]];
					row.fromTurn = recorded[r - 1] + 1;
					row.scoreChange = prev.s != null ? now.s - prev.s : null;
					row.militaryChange = now.m - prev.m;
					row.capitalChange = now.c - prev.c;
					row.freighterChange = now.f - prev.f;
					row.newCapitals = Math.max(0, row.capitalChange);
					row.newFreighters = Math.max(0, row.freighterChange);
					//the military change left for builds once the minefields seen are taken out
					row.mines = this.getMineChange(ownerid, row.fromTurn, row.turn);
					row.buildChange = row.militaryChange - (row.mines ? Math.round(row.mines.value) : 0);
				}
				for (var i = 0; i < ships.length; i++) {
					if (ships[i].firstSeen == row.turn && !ships[i].predicted)
						row.firstSeen.push(ships[i].ship.id);
				}
				//the start of the game only serves as the base of turn 2
				if (!now.start)
					turns.push(row);
			}
			turns.reverse();

			return { turns: turns, ships: ships };
		},

		escapeHtml: function (text) {
			return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/'/g, "&#39;").replace(/"/g, "&quot;");
		},

		/**
		 * Format a change in a score value: green for gains, red for losses
		 * @param change	change, undefined if unknown
		 * @return 			html text
		 */
		formatChange: function (change) {
			if (change == null)
				return "";
			if (change > 0)
				return " <span style='color:#33CC33'>(+" + change + ")</span>";
			if (change < 0)
				return " <span style='color:#FF4040'>(" + change + ")</span>";
			return " <span style='color:#808080'>(0)</span>";
		},

		/**
		 * Text for the turn of a score row, a range if turns are missing from the score history
		 */
		formatTurnRange: function (row) {
			return row.fromTurn == row.turn ? "" + row.turn : row.fromTurn + "-" + row.turn;
		},

		/**
		 * Generate the build predictor tab for the selected player: score changes per turn and
		 * a summary of the player's known ships
		 * @param html	page header generated by showEnemyShips
		 */
		showBuildPredictor: function (html) {
			var plugin = vgap.plugins["enemyShipListPlugin"];
			var numTurns = Object.keys(plugin.scoreHistory).length;

			html += "<style type='text/css'>.BuildPredictTable td{border-bottom:solid 1px #666; padding-right:16px} .BuildPredictTable th{text-align:left; padding-right:16px} .BuildPredictTable .Narrow{padding-right:8px; white-space:nowrap}</style>";
			html += "<p><h1>Build Predictor</h1></p>";
			html += "<p>Compares the scoreboard of each turn to the turn before. A rise in warships or freighters means at least that many were built (losses in the same turn hide builds). " +
				"Minefields seen in a turn and the turn before count toward the military change (0.27 per mine unit, less the torpedoes laid as mines) and are left out of the build estimate; they are recorded as turns are loaded. " +
				"Score history: " + numTurns + " turn" + (numTurns == 1 ? "" : "s") + " recorded. " +
				"<button type='button' class='TestButton' onClick='vgap.plugins[\"enemyShipListPlugin\"].loadScoreHistoryFromServer();'>Load score history for all turns</button></p>";

			if (!plugin.enabled) {
				html += "</div>";
				plugin.pane = $(html).appendTo(vgap.dash.content);
				plugin.pane.jScrollPane();
				vgap.action();
				return;
			}

			var player = vgap.getPlayer(plugin.playerFilterId);
			var race = vgap.getRace(player.raceid);
			var color = plugin.colorsA[player.id];

			//player selection, shared with the single player view; large and in the player's colour, as the heading of the page
			html += "<p><select id='buildPredictorPlayer' style='font-size:20px; font-weight:bold; color:" + color + "; background:#000; padding:2px 4px;' " +
				"onChange='vgap.plugins[\"enemyShipListPlugin\"].playerFilterId = this.options[this.selectedIndex].value; " +
				"vgap.plugins[\"enemyShipListPlugin\"].estimateTurn = null; " +
				"vgap.plugins[\"enemyShipListPlugin\"].showEnemyShipsView(8);'>";
			for (var p = 0; p < vgap.players.length; p++) {
				var option = vgap.players[p];
				var optionRace = vgap.getRace(option.raceid);
				html += "<option style='color:" + plugin.colorsA[option.id] + "' " + (option.id == plugin.playerFilterId ? "selected='selected' " : "") +
					"value='" + option.id + "'>" + option.id + ": " + plugin.escapeHtml(option.username) + " - " + (optionRace ? optionRace.name : "?") +
					(plugin.isPlayerDead(option.id) ? " (dead)" : "") + "</option>";
			}
			html += "</select></p>";
			var history = plugin.getBuildHistory(player.id);
			var latest = history.turns.length > 0 ? history.turns[0] : null;

			var capitalsKnown = 0;
			var freightersKnown = 0;
			for (var i = 0; i < history.ships.length; i++) {
				if (history.ships[i].type == "capital")
					capitalsKnown++;
				else
					freightersKnown++;
			}

			//summary of the latest recorded turn
			if (latest) {
				html += "<table class='BuildPredictTable' border='0'><tr>" +
					"<td>Turn " + latest.turn + "</td>" +
					"<td>Score: " + latest.score + plugin.formatChange(latest.scoreChange) + "</td>" +
					"<td>Military: " + latest.military + plugin.formatChange(latest.militaryChange) + "</td>" +
					"<td title='Known / scoreboard (new this turn)'>Warships: " + capitalsKnown + " / " + getNumForPlayer(player.id, "capitalships") + plugin.formatChange(latest.newCapitals) + "</td>" +
					"<td title='Known / scoreboard (new this turn)'>Freighters: " + freightersKnown + " / " + getNumForPlayer(player.id, "freighters") + plugin.formatChange(latest.newFreighters) + "</td>" +
					"</tr></table>";

				//the ships of yourself, full allies and players sharing intel are all seen, so their builds are not predicted
				if (plugin.isSharedPlayer(player.id))
					html += "<h3>Build estimate</h3><p>" + (player.id == vgap.player.id ? "These are your own builds" :
						"This player is a full ally or shares intel with you") + ", so all their ships are seen and their builds are not predicted.</p>";
				else
					html += plugin.buildEstimatorHtml(player, history);
			}

			//score changes on the left, ship summary on the right
			html += "<div style='display:flex; flex-wrap:wrap; align-items:flex-start; gap:32px;'>";

			if (latest) {
				//most recent turns first, all turns in their own scroll area
				html += "<div><h3>Score changes</h3>";
				html += "<div id='BuildPredictScores' style='display:inline-block; overflow-y:auto;'><table class='BuildPredictTable' border='0'><thead><tr>" +
					"<th>Turn</th><th>Score</th><th>Military</th>" +
					"<th class='Narrow' title='Military change from the minefields seen: 0.27 per mine unit, less the torpedoes the laid mines used'>Mines</th>" +
					"<th class='Narrow' title='Change against the previous turn; a rise is the minimum number built'>Warships</th>" +
					"<th class='Narrow' title='Change against the previous turn; a rise is the minimum number built'>Freighters</th><th>Ids first seen</th>" +
					"</tr></thead><tbody>";
				for (var t = 0; t < history.turns.length; t++) {
					var row = history.turns[t];
					html += "<tr style='color:" + color + "'>" +
						"<td>" + plugin.formatTurnRange(row) + "</td>" +
						"<td>" + row.score + plugin.formatChange(row.scoreChange) + "</td>" +
						"<td>" + row.military + plugin.formatChange(row.militaryChange) + "</td>" +
						"<td class='Narrow'>" + (row.mines ? plugin.formatChange(Math.round(row.mines.value)) : "") + "</td>" +
						"<td class='Narrow'>" + row.capitals + plugin.formatChange(row.capitalChange) + "</td>" +
						"<td class='Narrow'>" + row.freighters + plugin.formatChange(row.freighterChange) + "</td>" +
						"<td>" + row.firstSeen.join(", ") + "</td>" +
						"</tr>";
				}
				html += "</tbody></table></div></div>";
			} else {
				html += "<p>No score history recorded for this player yet.</p>";
			}

			//known ships of this player, then the ships on the scoreboard that are not in the list
			var missingCapitals = Math.max(0, getNumForPlayer(player.id, "capitalships") - capitalsKnown);
			var missingFreighters = Math.max(0, getNumForPlayer(player.id, "freighters") - freightersKnown);
			if (history.ships.length > 0 || missingCapitals > 0 || missingFreighters > 0) {
				html += "<div><h3>Ship summary</h3>";
				html += "<table class='BuildPredictTable' border='0'><thead><tr>" +
					"<th>Id</th><th>Hull</th><th>Ship Name</th><th>Type</th><th>First Seen</th><th>Last Seen</th>" +
					"</tr></thead><tbody>";
				for (var i = 0; i < history.ships.length; i++) {
					var entry = history.ships[i];
					if (entry.predicted) {
						html += "<tr style='color:" + color + "; font-style:italic;' title='Predicted build, chosen in the build estimate'>" +
							"<td>?</td>" +
							"<td>" + vgap.getHull(entry.ship.hullid).name + "</td>" +
							"<td>" + (entry.ship.starting ? "Starting freighter" : entry.ship.custom ? "Custom predicted build" : "Predicted build") + "</td>" +
							"<td>" + (entry.type == "capital" ? "Warship" : "Freighter") + "</td>" +
							"<td>" + entry.firstSeen + (entry.ship.starting ? " (start)" : " (predicted)") + "</td>" +
							"<td>-</td>" +
							"</tr>";
						continue;
					}
					html += "<tr style='color:" + color + "'>" +
						"<td>" + entry.ship.id + "</td>" +
						"<td>" + vgap.getHull(entry.ship.hullid).name + "</td>" +
						"<td>" + plugin.escapeHtml(entry.ship.name) + plugin.mergeControlHtml(entry.ship) + "</td>" +
						"<td>" + (entry.type == "capital" ? "Warship" : "Freighter") + "</td>" +
						"<td>" + entry.firstSeen + "</td>" +
						"<td>" + entry.lastSeen + "</td>" +
						"</tr>";
				}
				for (var m = 0; m < missingCapitals + missingFreighters; m++) {
					html += "<tr style='color:#808080'>" +
						"<td>?</td><td>Unknown</td><td>Not in list</td>" +
						"<td>" + (m < missingCapitals ? "Warship" : "Freighter") + "</td>" +
						"<td>-</td><td>-</td>" +
						"</tr>";
				}
				html += "</tbody></table></div>";
			}
			html += "</div>";

			html += "<p>&nbsp;</p></div>";

			plugin.pane = $(html).appendTo(vgap.dash.content);

			plugin.buildManualCalculator(player.id);

			//limit the score table to scoreVisibleTurns rows, measured once rendered; the rest scrolls
			var scores = $("#BuildPredictScores");
			var rows = scores.find("tbody tr");
			if (rows.length > plugin.scoreVisibleTurns) {
				scores.css("max-height", scores.find("thead").outerHeight() + rows.first().outerHeight() * plugin.scoreVisibleTurns);
			}
			//keep the mouse wheel on the score table from scrolling the whole page
			scores.on("mousewheel DOMMouseScroll wheel", function (e) { e.stopPropagation(); });

			plugin.pane.jScrollPane();

			// vgap.action added for the assistant (Alex):
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
