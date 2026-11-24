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
1.41   Added a 'Build Predictor' tab. Records the scoreboard every turn and shows per player the changes in score, military score, warships and freighters, with the ships first seen each turn and a summary of the player's known and missing ships. A build estimate lists ship configurations that could explain a turn's military score change, tuned on complete games: it follows each race's usual fighters, sweepers and scouts in each phase of the game (opening, early, close to the ship limit), shows the starbase builds (starbase fighters, defense posts, loaded ammo) that make up the rest of the change, shows the starting build on turn 2 and lists every player's starting freighter until it is seen, lists the 5 likeliest configurations, none worth more than 1.25 times the military change, above a table of how often the estimate was right on complete games with the model version it was measured on, lets a configuration be stored as the predicted build, listed and counted with the ships seen but marked as predicted until a matching ship is seen, and stops at the ship limit (the manual build, which also takes starbase builds, still works). A manual build can be stored as a custom predicted build. The torpedoes loaded and laid as mines are judged by the launchers known, weighted by how much each type is used in complete games (low grade launchers are rarely loaded) and by how recently the ships were seen.
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
		shipHistoryMargin: 100,	//light years shown around a ship's path by 'Show ship history'
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
			opening: { seen: [0.97, 0.73, 0.53], unseen: [0.97, 0.71, 0.59] },
			early: { seen: [0.93, 0.62, 0.34], unseen: [0.95, 0.7, 0.45] },
			nearCap: { seen: [0.87, 0.53, 0.23], unseen: [0.85, 0.54, 0.23] },
			afterCap: { seen: [0.87, 0.53, 0.23], unseen: [0.85, 0.54, 0.23] }
		},
		estimateConfidenceSpread: 0.94,
		//ranks the sets the search keeps: LightGBM LambdaMART trees learned on complete games (tools/rank.py, written by
		//tools/writeranker.py). The score of a set is the sum of a leaf of each tree. Each tree is [nodes, leaves], nodes holding four
		//numbers each: feature (index in the features), threshold, and the next node for at most and above the threshold, a child
		//below 0 being leaf ~child. null ranks by the score of the search.
		estimateRanker: {"trees":[[[21,0.0375,1,5,31,0.8444444,2,4,27,0.45,-1,3,10,0.04505639,-2,-3,7,2.5,-4,-5,15,-3.38633,6,11,31,0.8444444,7,10,7,1.5,8,-9,21,0.1765,9,-8,9,3.661882,-6,-7,3,1.5,-10,-11,8,1.620342,-12,12,25,-0.8613667,-13,13,9,1.875526,-14,-15],[-0.092952,-0.0078991,-0.072039,0.068632,0.018994,0.0052261,-0.050136,0.031525,-0.052997,0.065891,0.017479,0.090354,0.066968,0.04593,-0.014514]],[[8,3.050104,1,4,8,1.620342,2,3,13,1e-35,-1,-2,16,0.6333333,-3,-4,24,-3.3598,5,6,21,0.0225,-5,-6,18,0.7888889,7,8,27,0.8166667,-7,-8,4,1823.5,9,11,34,98.875,10,-11,32,0.4183333,-9,-10,33,3238.583,12,-15,34,67.16667,-12,13,8,3.545648,-13,-14],[0.094481,0.05536,-0.0353,0.031145,-0.082958,-0.038765,-0.033295,0.026316,0.036591,-0.033568,-0.035549,-0.054143,-0.0031803,-0.030423,0.0086332]],[[9,2.890714,1,10,8,2.022332,2,3,8,1.243645,-1,-2,26,1e-35,4,5,20,-3.33106,-3,-4,10,0.1051316,6,8,25,-0.9075074,-5,7,10,0.02010101,-6,-7,16,0.7083333,-8,9,19,0.422619,-9,-10,24,-2.043088,11,13,26,0.02125,-11,12,9,4.063886,-12,-13,10,0.1401754,-14,-15],[0.071447,0.046299,-0.069068,-0.013454,0.037328,0.022057,-0.0018862,-0.015058,-0.0038868,0.023028,-0.080991,-0.036061,-0.069373,0.032902,-0.023706]],[[9,2.890714,1,11,8,2.022332,2,3,13,1e-35,-1,-2,27,0.45,4,5,20,-2.805332,-3,-4,8,3.050104,6,7,25,-0.9075074,-5,-6,4,1369.5,8,10,37,1.291667,9,-9,20,-2.223662,-7,-8,23,8.5,-10,-11,20,-2.924805,-12,12,4,978.5,-13,13,31,0.8444444,-14,-15],[0.084373,0.046983,-0.064214,-0.0046232,0.033658,0.010521,0.0074436,0.053947,-0.039702,-0.0085613,0.0087526,-0.071924,0.020427,-0.048319,-0.016488]],[[10,0.1051316,1,7,10,0.005012563,2,3,3,1.5,-1,-2,25,-0.3465736,4,-7,15,-3.22343,5,6,50,0.5857143,-3,-4,12,0.4449999,-5,-6,26,0.01925,8,9,19,0.0655914,-8,-9,18,0.9444444,10,12,31,0.8444444,11,-12,6,16.5,-10,-11,10,0.240155,13,-15,14,560.5,-13,-14],[0.053459,0.016367,0.035338,-0.0032518,0.015731,0.03983,0.0062253,-0.072952,-0.0072522,-0.0035658,-0.051732,0.013982,0.018116,-0.025989,-0.036071]],[[8,3.360653,1,7,8,1.839999,2,4,13,1e-35,-1,3,20,-2.052514,-2,-3,25,-0.9075074,5,6,15,-3.22343,-4,-5,8,2.540535,-6,-7,24,-3.3598,-8,8,50,0.8166667,9,12,4,1489.5,10,11,20,-2.26136,-9,-10,13,0.4865809,-11,-12,19,0.3693182,13,-15,33,3906.75,-13,-14],[0.077702,-0.0024758,0.047391,-0.0011976,0.034958,0.020078,-0.0019241,-0.066741,-0.015495,0.042037,0.0055129,-0.036045,-0.034368,0.0010079,-0.004826]],[[10,0.1051316,1,9,10,0.01002513,2,6,16,0.9,-1,3,12,0.4570379,-2,4,12,1.000005,5,-5,12,0.9951441,-3,-4,25,-0.9075074,7,8,20,-1.932534,-6,-7,9,1.875526,-8,-9,9,2.906421,10,13,27,0.45,-10,11,18,0.9444444,-11,12,4,1890.716,-12,-13,20,-2.924805,-14,-15],[-0.0066007,0.016676,0.045795,0.073346,0.023251,-0.0025088,0.033816,0.0095064,-0.036625,-0.053276,0.0069514,0.0072725,-0.02153,-0.065111,-0.034499]],[[10,0.1051316,1,8,8,1.839999,2,3,8,1.243645,-1,-2,25,-0.9075074,4,6,11,-0.7550033,-3,5,0,0.2452222,-4,-5,10,0.02010101,7,-8,16,0.55,-6,-7,24,-3.3598,-9,9,18,0.9444444,10,11,27,0.7083333,-10,-11,4,1868.035,12,13,22,0.1464286,-12,-13,33,3570.25,-14,-15],[0.057729,0.037263,-0.0009738,0.041567,0.023921,-0.01962,0.020039,-0.0056472,-0.063275,-0.024939,0.0053612,0.011886,-0.025709,-0.037338,-0.0091397]],[[10,0.1051316,1,8,8,1.620342,2,4,13,1e-35,-1,3,24,-1.806949,-2,-3,25,-1.209718,5,6,11,-0.7550033,-4,-5,8,2.540535,7,-8,16,0.6333333,-6,-7,24,-2.913337,9,10,26,0.02216667,-9,-10,19,0.3484848,11,13,30,2.9,12,-13,14,3929.5,-11,-12,21,0.2825,-14,-15],[0.070681,0.0044387,0.045313,-0.0050237,0.031893,-0.010623,0.025249,0.00039494,-0.064261,-0.03898,-0.02238,0.0075639,-0.04235,0.0047797,-0.037599]],[[9,2.890714,1,12,15,-3.035801,2,5,26,1e-35,-1,3,13,1e-35,-2,4,50,0.4142857,-3,-4,11,0.3628258,6,9,13,1e-35,-5,7,20,-1.694825,-6,8,16,0.6333333,-7,-8,31,0.8444444,10,-12,14,450.5,-9,11,13,0.5750653,-10,-11,20,-2.924805,-13,13,31,0.8444444,-14,-15],[-0.046904,0.069135,0.01474,-0.001521,0.068852,0.015342,0.0050086,0.041968,0.019894,-0.0019756,-0.039116,0.019175,-0.059843,-0.03435,-0.0062642]],[[10,0.1051316,1,11,13,1e-35,-1,2,24,-1.892248,3,4,21,0.0195,-2,-3,3,1.5,5,-11,13,0.6257431,6,8,39,3.875,7,-6,37,1.916667,-4,-5,39,5.9,-7,9,5,8.5,10,-10,6,5.5,-8,-9,9,3.009487,12,13,27,0.45,-12,-13,24,-3.3598,-14,-15],[0.066707,-0.047678,0.0037555,0.040084,-0.0088475,0.039348,0.02676,-0.066309,-0.0039064,0.014837,0.0071212,-0.049625,-0.0036484,-0.060996,-0.035403]],[[9,2.814968,1,10,8,2.149103,2,4,13,1e-35,-1,3,20,-2.030779,-2,-3,27,0.7083333,5,6,19,0.4083333,-4,-5,8,3.050104,7,8,25,-0.8096549,-6,-7,4,1369.5,9,-10,22,0.1333992,-8,-9,20,-2.662047,11,12,27,0.6333333,-11,-12,4,1084.5,-13,13,19,0.0750469,-14,-15],[0.06575,0.00025445,0.035611,-0.045708,0.0064901,0.025173,0.0079592,0.032982,-0.01658,-0.0010348,-0.062207,-0.044962,0.020367,-0.037068,-0.010279]],[[9,2.73767,1,11,8,2.149103,2,5,13,1e-35,-1,3,16,0.6333333,-2,4,24,-1.315304,-3,-4,24,-3.336895,6,7,26,0.02216667,-5,-6,16,0.55,-7,8,31,0.7083333,9,-11,6,9.5,10,-10,26,0.33575,-8,-9,24,-2.653109,-12,12,4,951.78,-13,13,31,0.8444444,-14,-15],[0.064431,0.0015176,0.022939,0.040328,-0.050453,0.0060329,-0.01581,0.0031554,0.022623,-0.034964,0.018796,-0.053851,0.021125,-0.033661,-0.0064551]],[[9,2.73767,1,10,8,2.149103,2,4,8,1.243645,-1,3,16,0.6333333,-2,-3,21,1e-35,5,6,20,-2.728915,-4,-5,8,3.169278,7,9,12,0.4449999,8,-8,38,0.775,-6,-7,14,560.5,-9,-10,20,-2.924805,11,12,21,0.0215,-11,-12,19,0.422619,13,-15,9,4.404602,-13,-14],[0.048061,-0.0034724,0.02942,-0.048705,-0.0040057,-0.01274,0.029385,0.018621,0.018789,-0.0008061,-0.058954,-0.041716,-0.019678,-0.04465,0.00042702]],[[9,2.73767,1,10,8,2.540535,2,5,13,1e-35,-1,3,20,-1.872303,-2,4,12,0.4531191,-3,-4,27,0.55,6,7,20,-3.33106,-5,-6,31,0.8444444,8,9,30,1.708333,-7,-8,3,1.5,-9,-10,20,-2.189015,11,13,21,0.0215,-11,12,9,4.063886,-12,-13,4,951.78,-14,-15],[0.062293,0.0039942,0.0080997,0.032831,-0.050144,-0.0071574,0.0065845,-0.024382,0.019715,0.003689,-0.05749,-0.024788,-0.050653,0.027489,-0.016699]],[[9,2.73767,1,11,8,2.540535,2,7,13,1e-35,-1,3,16,0.6333333,-2,4,24,-1.315304,5,6,15,-3.40808,-3,-4,12,0.4143241,-5,-6,24,-3.3598,-7,8,16,0.55,-8,9,19,0.4365079,10,-11,6,4.5,-9,-10,20,-2.924805,-12,12,4,1041.5,-13,13,19,0.05798319,-14,-15],[0.061097,-0.004029,-0.022008,0.01965,0.0099438,0.038359,-0.033112,-0.01382,0.0056131,-0.0083277,0.0147,-0.052375,0.014336,-0.032216,-0.0087444]],[[10,0.1051316,1,8,8,1.620342,2,3,13,1e-35,-1,-2,20,-1.988885,4,6,9,1.563578,5,-5,13,1e-35,-3,-4,16,0.7083333,-6,7,13,0.6548645,-7,-8,24,-3.3598,-9,9,9,3.220264,10,13,18,0.9444444,11,12,31,0.8444444,-10,-11,29,0.9,-12,-13,31,0.8444444,-14,-15],[0.060589,0.033049,0.06213,0.0046644,-0.026539,-0.0018875,0.024039,0.0012758,-0.052257,-0.010403,0.0082163,-0.005351,-0.025056,-0.03745,-0.014444]],[[10,0.1051316,1,9,8,1.620342,2,3,13,1e-35,-1,-2,25,-0.3465736,4,6,12,1.000005,5,-5,12,0.1548128,-3,-4,28,0.23775,7,-9,31,0.8444444,8,-8,6,9.5,-6,-7,24,-3.3598,-10,10,14,3999.5,11,-15,19,0.3693182,12,13,6,6.5,-11,-12,20,-0.9375081,-13,-14],[0.059799,0.0318,-0.018534,0.02227,0.0014472,-0.0046154,-0.038151,0.0082785,0.019205,-0.051491,-0.018869,-0.039132,-0.0012211,-0.042346,0.00014525]],[[10,0.1051316,1,9,10,0.01002513,2,6,12,1.000005,3,-5,12,0.9951441,4,-4,12,0.3318454,-1,5,15,-1.204846,-2,-3,24,-1.892248,7,8,9,1.632008,-6,-7,25,-0.2940976,-8,-9,24,-3.3598,-10,10,9,3.220264,11,13,18,0.5357143,12,-13,31,0.6333333,-11,-12,31,0.8444444,-14,-15],[-0.0011806,0.023805,0.041447,0.057056,0.0072633,0.0039949,-0.028619,0.019592,0.0015707,-0.050719,-0.009395,0.011732,-0.011819,-0.035712,-0.012798]],[[9,2.73767,1,10,8,2.022332,2,4,13,1e-35,-1,3,15,-2.411497,-2,-3,27,0.8166667,5,6,31,0.775,-4,-5,16,0.775,-6,7,31,0.6333333,8,9,6,9.5,-7,-8,11,0.6446022,-9,-10,20,-2.924805,-11,11,4,1041.5,12,13,50,0.9166667,-12,-13,31,0.8444444,-14,-15],[0.058265,0.0044248,0.029385,-0.043373,-0.003904,-0.0080867,0.0064496,-0.031959,0.022575,0.0019941,-0.049256,0.026433,-0.036038,-0.028782,-0.0042552]],[[10,0.1051316,1,10,8,1.243645,2,3,13,1e-35,-1,-2,8,2.540535,4,7,12,0.3318454,-3,5,12,1.000005,6,-6,0,0.2452222,-4,-5,25,-1.209718,8,-10,20,-2.635972,-7,9,36,2.45,-8,-9,24,-3.3598,11,12,34,850.3333,-11,-12,9,3.837498,13,-15,23,7.5,-13,-14],[0.057681,0.034656,-0.0031682,0.037068,0.018204,-0.00073651,-0.0382,0.034417,0.012062,0.00045175,-0.050289,0.028539,-0.013921,0.0013999,-0.034232]],[[10,0.1051316,1,11,8,1.243645,-1,2,24,-1.87115,3,4,9,1.257649,-2,-3,16,0.9,-4,5,12,0.4449999,6,8,4,1795.597,-5,7,31,0.8444444,-6,-7,39,3.875,9,-11,37,1.291667,-8,10,6,2.5,-9,-10,24,-3.3598,-12,12,9,3.837498,13,-15,18,0.9444444,-13,-14],[0.03992,0.010908,-0.020286,-0.0047721,0.034437,-0.03905,0.0042836,0.028046,-0.044434,0.0011946,0.025891,-0.048636,0.00083576,-0.013554,-0.033231]],[[10,0.1051316,1,11,13,1e-35,-1,2,20,-1.988885,3,4,9,1.779471,-2,-3,13,0.551869,5,8,3,1.5,6,-7,39,3.875,7,-6,37,1.916667,-4,-5,4,1795.597,-8,9,34,419.0,10,-11,19,0.1622807,-9,-10,24,-3.3598,-12,12,9,3.872396,13,-15,34,185.5833,-13,-14],[0.05591,0.00064537,-0.030679,0.027524,-0.021527,0.028336,0.0092629,0.032559,-0.041891,-0.0033671,0.038041,-0.048022,-0.012891,0.0014646,-0.032631]],[[10,0.1051316,1,8,8,1.243645,-1,2,20,-1.988885,3,4,9,1.288619,-2,-3,16,0.55,-4,5,12,0.3318454,6,-8,4,1823.5,-5,7,38,0.775,-6,-7,20,-3.419273,9,10,14,5630.5,-9,-10,9,2.58177,-11,11,31,0.7083333,12,-15,6,8.5,13,-14,9,4.191928,-12,-13],[0.038125,0.0080704,-0.020012,-0.0075086,0.029428,-0.017298,0.021821,0.019248,-0.048229,0.0067327,-0.0023208,-0.013307,-0.037831,-0.042473,-0.0068671]],[[10,0.1051316,1,9,8,1.839999,2,5,8,1e-35,-1,3,12,1.000005,4,-4,12,0.9951441,-2,-3,25,-0.3465736,6,7,39,1.583333,-5,-6,9,1.632008,8,-9,50,0.6333333,-7,-8,20,-3.419273,10,11,14,5630.5,-10,-11,9,2.534163,12,13,20,-0.9562078,-12,-13,9,4.191928,-14,-15],[0.056633,0.026292,0.050788,0.004344,0.00050267,0.015517,0.014409,-0.0038199,-0.03119,-0.0476,0.0044625,-0.00029441,-0.036835,-0.015561,-0.033978]],[[10,0.1051316,1,10,13,1e-35,-1,2,20,-1.872303,3,4,20,-3.349983,-2,-3,8,1.839999,-4,5,4,825.5,-5,6,13,0.5107791,7,9,41,0.775,-6,8,37,1.291667,-7,-8,34,310.5833,-9,-10,20,-3.46437,-11,11,9,3.906749,12,-15,18,0.9444444,-12,13,25,-1.325812,-13,-14],[0.054698,-0.040193,-0.00064532,0.025603,0.034992,0.015945,0.017392,-0.031247,-0.0062989,0.028968,-0.045528,0.001931,-0.0057388,-0.023142,-0.030671]],[[10,0.1051316,1,11,13,1e-35,-1,2,20,-1.694825,3,7,20,-3.349983,-2,4,4,1489.5,-3,5,33,5410.25,6,-6,31,0.8444444,-4,-5,16,0.9,-7,8,13,0.5479032,9,-11,39,3.366667,10,-10,37,1.45,-8,-9,27,0.45,-12,12,9,3.872396,13,-15,14,3999.5,-13,-14],[0.053542,-0.038073,0.018652,-0.01574,0.0094566,0.017648,-0.0063442,0.024275,-0.021182,0.026331,0.0043756,-0.048105,-0.011155,0.0033517,-0.032686]],[[9,2.73767,1,11,13,1e-35,-1,2,10,0.04013423,3,6,16,0.9,-2,4,20,-1.373693,-3,5,12,0.4143241,-4,-5,27,0.8166667,-6,7,31,0.8444444,8,10,29,0.7083333,-7,9,7,1.5,-8,-9,16,0.55,-10,-11,20,-2.924805,12,13,21,0.0145,-12,-13,10,0.1051316,-14,-15],[0.052996,-0.0077286,0.0082683,0.0037979,0.028398,-0.023181,0.0036181,-0.009046,-0.041774,-0.016631,0.012878,-0.051271,-0.032259,0.016348,-0.016458]],[[10,0.1051316,1,11,13,1e-35,-1,2,20,-1.694825,3,4,20,-3.349983,-2,-3,16,0.9,-4,5,13,0.6548645,6,-11,39,3.366667,7,9,37,1.45,-5,8,6,2.5,-6,-7,13,0.2722253,-8,10,20,-1.105664,-9,-10,20,-3.476496,-12,12,9,4.027896,13,-15,19,0.6904762,-13,-14],[0.05217,-0.037044,0.0008501,-0.0047508,0.023223,-0.043603,0.0040531,0.028355,0.0031944,0.026749,-0.0011206,-0.043959,-0.0081559,0.017045,-0.029534]],[[10,0.1051316,1,9,8,1.243645,2,4,13,1e-35,-1,3,15,-1.800281,-2,-3,8,2.743821,5,6,16,0.6333333,-4,-5,31,0.8444444,7,-9,6,7.5,8,-8,21,0.0235,-6,-7,27,0.45,-10,10,9,4.191928,11,13,34,190.1667,12,-13,38,0.225,-11,-12,31,0.8444444,-14,-15],[0.054698,0.0007962,0.031881,-0.0081933,0.01486,-0.037496,0.003251,-0.02874,0.0082267,-0.046544,-0.013417,0.010899,0.0034215,-0.03906,-0.0033526]],[[20,-3.235605,1,2,21,0.0225,-1,-2,8,2.743821,3,7,13,1e-35,-3,4,20,-1.606689,-4,5,13,0.4865809,6,-7,15,-1.204846,-5,-6,31,0.8444444,8,12,6,9.5,9,-12,13,0.8456303,10,-11,14,438.5,-8,11,14,2643.5,-9,-10,23,7.5,-13,13,19,0.8660714,-14,-15],[-0.046839,-0.011897,0.054014,0.0030968,0.018514,0.035214,0.0044733,0.02056,-0.010605,0.0065545,-0.035607,-0.033953,-0.0012802,0.0075188,0.042422]],[[24,-3.264451,1,3,26,0.02216667,-1,2,9,3.906749,-2,-3,8,2.743821,4,8,13,1e-35,-4,5,24,-1.372948,-5,6,16,0.6333333,-6,7,13,0.6498717,-7,-8,31,0.8444444,9,12,6,9.5,10,11,9,4.404602,-9,-10,7,1e-35,-11,-12,16,0.55,13,-15,6,34.5,-13,-14],[-0.047086,-5.1168e-05,-0.039176,0.053563,0.0057553,-0.0066544,0.025481,-0.0015615,-0.0014732,-0.032532,0.00070755,-0.038356,-0.030523,0.011258,0.0086526]],[[9,2.906421,1,10,8,1.839999,2,4,13,1e-35,-1,3,15,-2.411497,-2,-3,21,1e-35,5,6,19,0.4833333,-4,-5,11,0.6446022,7,-10,19,0.4833333,8,-9,29,0.7083333,9,-8,12,1.000005,-6,-7,21,0.0215,-11,11,31,0.8444444,12,-15,9,4.968012,13,-14,6,8.5,-12,-13],[0.053253,-0.004949,0.022204,-0.034027,0.00018774,0.010082,-0.013782,-0.0065712,0.011971,-0.0091201,-0.045793,-0.0095623,-0.035453,-0.044188,0.005799]],[[24,-2.70439,1,4,21,0.0195,-1,2,13,1e-35,-2,3,14,5965.5,-3,-4,10,0.04013423,5,10,13,1e-35,-5,6,15,-1.204846,7,9,17,0.775,-6,8,24,-1.372948,-7,-8,13,0.6399974,-9,-10,31,0.8444444,11,12,30,3.708333,-11,-12,23,7.5,-13,13,19,0.8660714,-14,-15],[-0.045539,0.052401,-0.020938,0.013279,0.052283,-0.011835,0.0059783,0.01731,0.031491,-0.0040069,-0.0022629,-0.035946,-0.0016464,0.0079676,0.039931]],[[24,-3.264451,1,2,26,0.02216667,-1,-2,10,0.06005464,3,9,13,1e-35,-3,4,24,-1.315304,5,7,30,3.55,-4,6,31,0.8444444,-5,-6,16,0.55,-7,8,13,0.6498717,-8,-9,31,0.8444444,10,12,7,1.5,-10,11,29,0.775,-11,-12,16,0.55,13,-15,2,21.5,-13,-14],[-0.04569,-0.015403,0.051242,0.006854,-0.053152,0.0078449,-0.0078139,0.023482,-0.0029729,-0.0057871,-0.0081475,-0.039886,-0.038704,-0.0026142,0.0073735]],[[24,-3.264451,1,3,21,0.0225,-1,2,9,4.063886,-2,-3,8,2.681335,4,9,13,1e-35,-4,5,24,-1.600569,6,7,9,1.104548,-5,-6,16,0.6333333,-7,8,13,0.4865809,-8,-9,31,0.8444444,10,12,6,9.5,11,-12,9,4.404602,-10,-11,16,0.55,13,-15,6,34.5,-13,-14],[-0.045111,-0.00085896,-0.039268,0.051739,0.0061478,-0.02317,-0.0062421,0.021972,0.0039017,-0.0013897,-0.03071,-0.029222,-0.028143,0.011575,0.0075243]],[[24,-2.70439,1,4,9,2.05892,2,3,13,1e-35,-1,-2,26,1e-35,-3,-4,8,2.022332,5,6,13,1e-35,-5,-6,13,0.7122632,7,12,14,641.5,-7,8,19,0.4606061,9,11,30,1.583333,10,-10,40,0.4142857,-8,-9,16,0.775,-11,-12,4,1868.035,-13,13,5,8.5,-14,-15],[0.047468,-0.004323,-0.047548,-0.024797,0.051926,0.016743,0.024698,-0.0088397,0.0091949,-0.010171,-0.0090533,0.01335,0.022577,-0.032141,-0.0015922]],[[27,0.8166667,1,2,31,0.775,-1,-2,8,2.681335,3,8,13,1e-35,-3,4,28,0.29125,5,-8,31,0.6333333,6,-7,7,1e-35,-4,7,6,4.5,-5,-6,31,0.8444444,9,12,6,13.5,10,-12,14,2643.5,11,-11,7,1.5,-9,-10,16,0.775,13,-15,18,0.9444444,-13,-14],[-0.045015,-0.0092523,0.050696,0.01111,0.002194,-0.049856,0.015434,0.031294,-0.0066663,-0.029695,0.005881,-0.033702,0.0037823,-0.022264,0.010804]],[[24,-3.264451,1,3,27,0.45,-1,2,34,850.3333,-2,-3,8,2.681335,4,8,8,1.243645,-4,5,0,0.197,-5,6,19,0.3038462,-6,7,6,3.5,-7,-8,12,0.1548128,-9,9,14,541.5,-10,10,19,0.3484848,11,13,6,13.5,12,-13,14,3836.5,-11,-12,16,0.775,-14,-15],[-0.046137,-0.022939,0.036533,0.028705,0.020994,-0.0020533,-0.0052371,0.016942,-0.023619,0.016282,-0.0089146,0.0098203,-0.020084,-0.0064146,0.0083562]],[[24,-2.70439,1,4,21,0.0195,-1,2,9,4.063886,3,-4,13,1e-35,-2,-3,10,0.01507576,5,7,13,1e-35,-5,6,28,0.28125,-6,-7,13,0.6839627,8,12,14,657.5,-8,9,14,1725.5,-9,10,19,0.775,-10,11,6,14.5,-11,-12,4,1868.035,-13,13,5,8.5,-14,-15],[-0.042613,0.04873,-0.0076989,-0.03789,0.050575,0.010401,0.031725,0.02226,-0.0088764,0.0020404,0.0066777,0.04131,0.019137,-0.028784,-0.00096107]],[[24,-3.3914,1,3,27,0.8166667,-1,2,9,3.837498,-2,-3,8,1.620342,4,5,13,1e-35,-4,-5,31,0.8444444,6,10,6,9.5,7,9,9,4.191928,8,-8,33,5410.25,-6,-7,7,1e-35,-9,-10,16,0.55,11,12,6,34.5,-11,-12,27,0.8166667,-13,13,6,4.5,-14,-15],[-0.045787,-0.0015712,-0.037872,0.050992,0.017565,-0.00037344,0.021152,-0.025767,0.00012526,-0.036497,-0.02197,0.0095772,-0.0090459,0.0017821,0.014719]],[[24,-2.70439,1,4,27,0.8166667,-1,2,9,4.063886,3,-4,13,1e-35,-2,-3,8,1.243645,5,6,13,1e-35,-5,-6,13,0.6839627,7,11,8,3.169278,-7,8,37,0.3666667,-8,9,4,1642.0,10,-11,37,1.291667,-9,-10,4,1868.035,-12,12,5,8.5,13,-15,23,7.5,-13,-14],[-0.043975,0.047357,-0.0084187,-0.037721,0.050236,0.021448,0.0087419,0.0077895,0.023906,-0.038754,-0.0012661,0.020039,-0.036076,0.00036508,0.00022565]],[[24,-3.3914,1,3,26,1e-35,-1,2,9,4.10115,-2,-3,8,2.365214,4,9,13,1e-35,-4,5,24,-1.892248,-5,6,12,0.6391199,7,8,23,8.5,-6,-7,28,0.28125,-8,-9,31,0.8444444,10,13,6,9.5,11,12,9,4.909891,-10,-11,7,1e-35,-12,-13,49,0.4166667,-14,-15],[-0.044971,-0.0039848,-0.039406,0.049448,-0.0096189,-0.0037389,0.024271,0.015212,0.038985,-0.0014162,-0.037301,0.0033619,-0.034069,0.0027299,0.024619]],[[24,-2.70439,1,3,27,0.8166667,-1,2,9,4.063886,-2,-3,8,1.243645,4,5,10,1e-35,-4,-5,11,0.6446022,6,13,19,0.4833333,7,-13,26,0.33575,8,9,27,0.8166667,-6,-7,6,18.5,10,-12,39,4.366667,11,-11,11,0.3628258,12,-10,32,0.6464461,-8,-9,5,8.5,-14,-15],[-0.043068,-0.0057454,-0.036645,0.033632,0.012448,-0.027609,-0.00198,-0.044877,0.0061898,0.021128,0.021575,-0.013863,0.0090596,-0.014982,0.001707]],[[24,-3.3914,1,2,27,0.8166667,-1,-2,8,1.243645,3,4,12,1.000005,-3,-4,24,-1.87115,5,6,9,2.180381,-5,-6,11,0.6446022,7,10,2,5.5,8,9,25,-1.994919,-7,-8,19,0.4833333,-9,-10,4,2073.765,11,13,22,0.4188596,-11,12,4,1766.005,-12,-13,23,1.5,-14,-15],[-0.044214,-0.017658,0.031719,-0.0045979,0.00054061,-0.015609,-0.0099453,0.028207,-1.9096e-05,0.0086852,0.021032,-0.044844,0.026632,-0.041066,-0.0089445]],[[24,-2.653109,1,3,27,0.8166667,-1,2,33,6051.0,-2,-3,8,1.243645,4,5,12,1.000005,-4,-5,12,0.3116493,6,7,5,7.5,-6,-7,16,0.55,-8,8,31,0.7083333,9,-15,7,1.5,10,13,26,0.331625,-9,11,40,0.2916667,12,-12,12,0.8346498,-10,-11,29,0.775,-13,-14],[-0.041888,-0.015018,0.012068,0.030681,-0.0017173,-0.022496,0.00030882,-0.0089523,-0.0018621,0.015595,-0.044134,0.022085,-0.00052617,-0.0371,0.010644]],[[24,-3.3914,1,2,34,850.3333,-1,-2,8,1.243645,3,4,12,1.000005,-3,-4,31,0.8444444,5,12,30,1.708333,6,11,26,0.33575,7,8,9,4.191928,-5,-6,39,3.875,9,10,12,0.8346498,-7,-8,11,0.3628258,-9,-10,7,1.5,-11,-12,49,0.4166667,13,-15,27,0.8166667,-13,-14],[-0.035052,0.044002,0.030058,-0.0025848,-0.0017051,-0.02867,0.0092287,-0.050429,0.027894,-0.0057125,-0.012002,-0.037004,-0.013142,0.0058408,0.023599]],[[24,-3.549417,-1,1,13,1e-35,-2,2,31,0.8444444,3,11,6,9.5,4,10,26,0.33575,5,8,14,5415.5,6,-6,21,0.0605,-3,7,26,0.2981667,-4,-5,25,-1.994919,9,-9,4,1642.0,-7,-8,7,1e-35,-10,-11,8,1.243645,-12,12,49,0.875,13,-15,21,1e-35,-13,-14],[-0.03544,0.046635,-0.022995,-0.0029177,-0.036499,0.012644,-0.038972,0.016654,0.01665,0.00025431,-0.034931,0.021995,-0.011496,0.0057295,0.030463]],[[24,-3.647283,-1,1,13,1e-35,-2,2,31,0.8444444,3,12,6,9.5,4,10,26,0.33575,5,7,14,2677.5,6,-5,27,0.8166667,-3,-4,39,4.366667,8,9,12,0.8346498,-6,-7,13,0.4195322,-8,-9,7,1e-35,-10,11,19,0.775,-11,-12,15,-1.204846,13,-15,49,0.875,-13,-14],[-0.037201,0.045682,-0.040305,-0.0089443,0.0043313,0.0059019,-0.048051,0.02406,-0.014367,9.2018e-05,-0.037055,0.014884,0.0039728,0.029565,0.021339]],[[24,-3.647283,-1,1,10,0.01507576,2,5,12,1.000005,3,-5,12,0.9951441,4,-4,12,0.6391199,-2,-3,31,0.775,6,12,6,16.5,7,-12,14,5965.5,8,-11,27,0.8166667,-6,9,6,4.5,10,11,40,0.2361111,-7,-8,7,1e-35,-9,-10,16,0.55,13,-15,6,34.5,-13,-14],[-0.036677,0.0004528,0.015632,0.04461,-0.0054168,-0.037041,-0.0084026,0.0047689,-0.00044645,-0.027782,0.014679,-0.033945,-0.021367,0.008493,0.0063151]],[[21,1e-35,1,2,20,-3.33106,-1,-2,13,1e-35,-3,3,31,0.8444444,4,12,7,1.5,5,10,26,0.331625,6,9,9,4.997954,7,-7,21,0.2985,8,-6,21,0.276,-4,-5,33,1793.125,-8,-9,30,4.708333,11,-12,14,2854.5,-10,-11,16,0.775,-13,13,13,0.551869,-14,-15],[-0.041477,-0.011482,0.045472,-0.0043369,0.019278,-0.031386,-0.037959,0.00014296,0.019474,-0.026911,-0.0018403,-0.044663,-0.0081503,0.014578,0.0023114]],[[20,-3.630157,1,2,9,2.51804,-1,-2,13,1e-35,-3,3,31,0.775,4,10,7,1.5,5,9,26,0.331625,6,8,21,0.0375,-4,7,21,0.2985,-5,-6,11,0.6446022,-7,-8,29,0.775,-9,-10,16,0.55,11,12,18,0.9444444,-11,-12,21,1e-35,-13,13,10,0.005012563,-14,-15],[-0.0017278,-0.039026,0.043338,-0.020945,-0.002194,-0.028949,0.014711,-0.010494,-0.0024264,-0.033833,0.012926,-0.016552,-0.0090244,0.019863,0.0076599]],[[27,0.55,1,3,19,0.4833333,2,-3,49,0.4166667,-1,-2,13,1e-35,-4,4,31,0.775,5,13,7,1.5,6,12,26,0.331625,7,8,9,4.997954,-5,-6,25,-2.010604,9,10,4,1642.0,-7,-8,11,0.4890029,-9,11,4,1369.5,-10,-11,29,0.775,-12,-13,8,1.243645,-14,-15],[-0.03729,0.048977,-0.0034715,0.043512,-0.0036811,-0.037176,-0.039116,0.014635,0.02052,0.025524,-0.023469,-0.0081778,-0.032511,0.020924,0.0050196]],[[9,4.191928,1,13,8,1.243645,2,3,8,1e-35,-1,-2,27,0.8166667,4,6,49,0.225,5,-5,19,0.4833333,-3,-4,11,0.6446022,7,12,12,1.000005,8,-11,22,0.8603896,9,-10,12,0.7328118,10,11,25,-1.253665,-6,-7,39,3.1,-8,-9,4,2087.5,-12,-13,20,-2.189015,-14,-15],[0.050079,0.018157,-0.031131,-0.0060627,0.039403,0.0099759,-0.0097023,-0.014276,0.013453,0.010962,-0.0080625,0.0096535,-0.015188,-0.038508,-0.0027138]],[[24,-3.659057,-1,1,13,1e-35,-2,2,24,-1.892248,3,4,14,4627.5,-3,-4,16,0.55,-5,5,13,0.551869,6,11,40,0.2916667,7,10,50,0.2916667,-6,8,13,0.279936,9,-9,37,1.45,-7,-8,24,-1.10582,-10,-11,4,1823.5,-12,12,35,9.9,13,-15,5,6.5,-13,-14],[-0.034247,0.041363,-0.010693,0.0081492,-0.010277,0.027109,-0.0047836,-0.037663,0.0069952,0.0077,0.022439,0.019796,-0.026988,-0.0034007,0.028133]],[[9,4.191928,1,13,8,1.243645,-1,2,27,0.8166667,3,4,19,0.4833333,-2,-3,11,0.5609234,5,12,16,0.775,6,8,50,0.5357143,-4,7,2,21.5,-5,-6,19,0.422619,9,11,21,0.3455,-7,10,39,5.45,-8,-9,6,4.5,-10,-11,14,788.5,-12,-13,20,-2.189015,-14,-15],[0.021572,-0.027104,-0.0031288,0.0090529,-0.027145,-0.0041218,-0.0017324,-0.0086171,0.020188,0.0025186,0.016391,0.0039073,-0.012848,-0.037643,-0.0026299]],[[24,-3.659057,-1,1,13,1e-35,-2,2,31,0.775,3,9,29,0.7083333,4,8,21,0.0375,5,6,14,5788.5,-3,-4,9,4.968012,7,-7,12,1.000005,-5,-6,7,1e-35,-8,-9,15,-1.204846,10,13,23,7.5,11,12,4,8050.889,-10,-11,19,0.8660714,-12,-13,12,0.6391199,-14,-15],[-0.033103,0.03998,-0.027994,0.017795,0.0051856,-0.0093253,-0.035194,-0.00104,-0.025458,0.0028763,-0.020282,0.006028,0.028564,0.0033095,0.028968]],[[24,-3.659057,-1,1,13,1e-35,-2,2,8,2.681335,3,10,24,-1.372948,4,7,4,1414.225,5,6,37,1.916667,-3,-4,14,5042.5,-5,-6,16,0.6333333,-7,8,13,0.5107791,9,-10,39,3.366667,-8,-9,33,3148.167,11,-15,9,4.937619,12,-14,4,7184.797,-11,13,23,8.5,-12,-13],[-0.032575,0.038584,0.024111,-0.058439,-0.0094305,0.011787,-0.0064585,-0.0059928,0.020064,-0.00063707,-0.0023005,-0.022756,0.0067202,-0.02786,0.0042488]],[[27,0.8166667,1,3,9,2.754088,2,-3,49,0.225,-1,-2,8,1.839999,4,5,28,0.29125,-4,-5,9,4.404602,6,-15,12,0.1548128,-6,7,12,1.002199,8,13,34,175.1667,9,-12,12,0.7525749,10,11,14,699.5,-7,-8,39,3.1,12,-11,37,1.291667,-9,-10,39,3.1,-13,-14],[-0.013779,0.037164,-0.037533,0.010553,0.035619,-0.015856,0.015938,-0.011384,0.0096578,-0.041771,0.011878,0.0067239,-0.024714,-0.001394,-0.020114]],[[24,-3.733439,-1,1,8,1.243645,2,4,12,1.000005,3,-4,12,0.9951441,-2,-3,11,0.5609234,5,11,12,1.002199,6,-11,28,0.29125,7,-10,19,0.4606061,8,10,26,0.105125,-5,9,30,3.55,-6,-7,16,0.7083333,-8,-9,4,1951.0,12,13,12,1.117603,-12,-13,5,8.5,-14,-15],[-0.033235,0.018468,0.04676,-0.0072018,-0.0081392,0.0051866,-0.0079719,-0.0062234,0.010407,0.01836,-0.010252,0.0124,-0.018584,-0.02451,0.00029093]],[[27,0.55,1,2,20,-3.33106,-1,-2,13,1e-35,-3,3,31,0.775,4,10,6,9.5,5,9,26,0.33575,6,7,14,2677.5,-4,-5,25,-1.994919,-6,8,11,0.3628258,-7,-8,7,1e-35,-9,-10,16,0.55,11,12,6,34.5,-11,-12,6,4.5,-13,13,19,0.6904762,-14,-15],[-0.037422,-0.0087363,0.038012,-0.0073118,0.0036631,-0.013575,0.020356,-0.0018043,0.00047345,-0.030439,-0.01808,0.0075089,0.0015834,0.0088608,0.023942]],[[21,1e-35,1,2,20,-3.33106,-1,-2,13,1e-35,-3,3,31,0.8444444,4,12,6,16.5,5,-12,21,0.3455,6,9,14,5965.5,7,8,6,5.5,-4,-5,20,-3.33106,-6,-7,14,1651.5,10,-11,4,951.78,11,-10,32,0.241423,-8,-9,16,0.55,13,-15,6,34.5,-13,-14],[-0.036741,-0.0085193,0.036895,-0.0029354,-0.021246,0.048412,0.0042257,0.032083,-0.064445,-0.012543,0.016326,-0.032182,-0.01712,0.0073154,0.0083119]],[[24,-3.733439,-1,1,8,1.243645,-2,2,31,0.775,3,13,6,16.5,4,-13,11,0.5609234,5,12,40,1e-35,6,9,37,1.45,-3,7,12,0.6747432,8,-6,4,1878.5,-4,-5,11,0.3628258,10,11,21,0.1905,-7,-8,32,0.8623737,-9,-10,4,1951.0,-11,-12,16,0.55,-14,-15],[-0.031427,0.018754,0.0018732,-0.028017,0.035758,-0.043069,0.00093945,0.016701,-0.020303,0.052925,0.0020694,-0.020681,-0.03149,-0.0096681,0.0056504]],[[9,4.210703,1,12,8,1.243645,2,4,12,1.000005,3,-3,12,0.9951441,-1,-2,21,1e-35,5,7,49,0.225,6,-6,19,0.4833333,-4,-5,11,0.5609234,8,9,12,1.000005,-7,-8,5,7.5,10,-12,12,0.3116493,11,-11,39,5.125,-9,-10,31,0.8444444,13,-15,21,0.0715,-13,-14],[0.017027,0.045818,-0.0078526,-0.026473,-0.0053346,0.034749,0.0036823,-0.0075271,-0.014651,-0.043,-0.0056846,0.001981,-0.040221,-0.016566,0.0037291]],[[9,4.210703,1,13,10,0.01507576,2,8,0,0.2952222,3,6,12,1.000005,4,-4,12,0.6479745,-1,5,10,1e-35,-2,-3,31,0.8444444,7,-7,6,9.5,-5,-6,27,0.8166667,9,10,49,0.225,-8,-9,33,2665.167,11,12,38,0.225,-10,-11,12,0.960768,-12,-13,20,-2.189015,-14,-15],[-0.0014388,0.040466,0.018221,-0.012171,0.0018994,-0.035887,0.0085267,-0.017507,0.032905,-0.0045456,0.0086764,0.0070709,-0.0048124,-0.034057,8.6364e-05]],[[24,-2.70439,1,2,9,4.063886,-1,-2,8,1.243645,3,4,13,1e-35,-3,-4,12,0.3116493,5,6,5,8.5,-5,-6,12,1.000005,7,10,33,596.75,-7,8,36,7.55,9,-10,13,0.2722253,-8,-9,50,0.5357143,-11,11,39,6.708333,12,-15,37,1.916667,13,-14,34,144.1667,-12,-13],[-0.006935,-0.035096,0.04752,0.012948,-0.017776,0.0042461,0.018056,0.0047732,-0.0052916,0.0084807,0.0056057,0.03062,-0.025213,-0.043873,-0.0020961]],[[21,1e-35,1,2,20,-3.33106,-1,-2,13,1e-35,-3,3,19,0.2928571,4,10,6,6.5,5,6,9,5.030136,-4,-5,36,9.55,7,9,20,-1.058635,8,-8,38,3.291667,-6,-7,13,0.2004361,-9,-10,16,0.55,11,13,6,34.5,12,-13,4,1878.5,-11,-12,10,1e-35,-14,-15],[-0.034558,-0.0076964,0.034459,0.0011896,-0.034745,-0.024103,-0.0032812,0.0089827,-0.013471,0.023916,0.021134,-0.021024,0.0072747,0.01983,0.0058707]],[[27,0.8166667,1,2,20,-3.33106,-1,-2,8,1.839999,3,5,13,1e-35,-3,4,28,0.29125,-4,-5,22,0.8603896,6,11,4,6201.5,7,8,24,-1.87115,-6,-7,23,8.5,9,-11,5,8.5,10,-10,6,19.5,-8,-9,4,4812.67,-12,12,5,7.5,13,-15,29,1e-35,-13,-14],[-0.03394,-0.0077358,0.046371,0.0063592,0.028679,-0.0056474,0.0034984,-0.035593,-0.0098365,-0.0042214,0.0051805,-0.035838,0.025739,0.0076458,0.00074618]],[[20,-2.189015,1,2,9,4.046216,-1,-2,8,1.243645,-3,3,12,0.3116493,4,7,5,8.5,5,-7,4,2453.02,-4,6,6,17.5,-5,-6,14,699.5,-8,8,16,0.55,-9,9,14,1848.5,10,-15,37,1.45,11,13,4,1642.0,-10,12,6,3.5,-11,-12,4,1414.225,-13,-14],[-0.0039628,-0.030565,0.01715,0.0092465,-0.034255,0.001764,0.0042163,0.023421,-0.0073213,0.0218,-0.033405,0.0092805,-0.049451,0.00068607,0.0060171]],[[24,-2.70439,1,3,9,4.063886,2,-3,13,0.003650096,-1,-2,15,-1.204846,4,13,13,1e-35,-4,5,12,1.002199,6,9,13,0.7122632,-5,7,5,6.5,-6,8,4,7477.0,-7,-8,50,0.5357143,-9,10,39,4.708333,11,-13,37,1.45,12,-12,36,4.291667,-10,-11,13,0.2135377,-14,-15],[0.022083,-0.0083706,-0.033172,0.028229,0.002665,-0.020672,0.011594,-0.013538,0.0041633,0.025365,-0.034784,-0.049066,-0.0075625,0.032377,0.0047336]],[[31,0.775,1,11,6,9.5,2,9,9,4.968012,3,-8,26,0.33575,4,7,33,5410.25,5,-4,26,1e-35,-1,6,26,0.2981667,-2,-3,9,1e-35,-5,8,33,1204.25,-6,-7,7,1e-35,-9,10,23,9.5,-10,-11,16,0.7083333,-12,12,6,4.5,-13,13,19,0.5916667,-14,-15],[-0.02501,-0.0016998,-0.025958,0.013391,0.0305,-0.0056065,0.012469,-0.037476,1.6456e-10,-0.037636,-0.015529,-0.0059493,0.00051409,0.0066878,0.019883]],[[27,0.8166667,1,4,49,0.225,2,-4,20,-2.008029,-1,3,22,0.8834842,-2,-3,13,1e-35,5,6,25,-1.050327,-5,-6,15,-1.204846,7,13,11,0.5609234,8,12,33,5410.25,9,-11,39,2.9,10,-10,13,0.4104073,11,-9,37,1.45,-7,-8,36,1e-35,-12,-13,13,0.4705229,-14,-15],[-0.029226,0.00089053,-0.054469,0.032382,-0.0062634,0.043137,-0.0016214,-0.034626,0.012014,0.0019717,0.0083549,0.031235,-0.0076726,0.023491,-0.0042954]],[[31,0.775,1,11,6,9.5,2,10,21,0.0375,3,4,4,1455.5,-1,-2,26,0.33575,5,8,21,0.2985,6,-6,21,0.276,7,-5,21,0.2695,-3,-4,11,0.2554128,9,-9,40,0.4142857,-7,-8,7,1e-35,-10,-11,28,0.23775,12,-15,23,7.5,13,-14,4,8148.0,-12,-13],[-0.035972,-0.0083021,-0.00014937,-0.055507,0.02069,-0.02768,-0.021847,0.024447,-0.00091553,4.5343e-10,-0.028693,0.0029509,-0.019938,0.0076719,0.018215]],[[27,0.55,1,4,9,3.33816,2,-4,37,0.775,3,-3,34,57.25,-1,-2,13,1e-35,-5,5,31,0.7083333,6,12,6,16.5,7,-12,9,5.160447,8,-11,6,4.5,-6,9,34,270.1667,-7,10,2,16.5,-8,11,13,0.2526651,-9,-10,16,0.775,-13,13,6,5.5,-14,-15],[-0.025428,0.017152,-0.020209,-0.035126,0.03154,0.0016884,-0.018813,-0.02635,0.00059493,0.025521,-0.034015,-0.029584,-0.0055623,0.00068272,0.011049]],[[27,0.8166667,1,3,24,-3.336895,-1,2,37,0.3666667,-2,-3,13,1e-35,4,5,25,-1.050327,-4,-5,24,-1.892248,-6,6,8,2.743821,7,13,12,0.6391199,8,11,34,325.25,9,-10,4,1369.5,-7,10,5,7.5,-8,-9,0,0.293,12,-13,39,3.366667,-11,-12,21,0.4295,-14,-15],[-0.031516,0.0053774,-0.018125,-0.0064302,0.040752,-0.0042187,0.028639,-0.022826,-0.00047382,0.017853,-0.014796,0.023212,0.0056999,0.0016368,-0.011114]],[[31,0.775,1,9,6,16.5,2,-9,9,4.997954,3,-8,26,0.3095833,4,-7,26,0.2981667,5,8,6,5.5,-1,6,2,19.5,7,-4,7,1e-35,-2,-3,4,1533.5,-5,-6,16,0.55,10,11,6,34.5,-10,-11,13,1e-35,-12,12,6,4.5,-13,13,19,0.6904762,-14,-15],[-7.2872e-05,0.00017942,-0.031893,-0.0025763,0.015135,-0.064359,0.0073368,-0.035608,-0.029773,-0.015432,0.0064655,0.042921,-0.00096154,0.0056116,0.019775]],[[27,0.55,1,4,9,3.33816,2,-4,37,0.775,3,-3,34,57.25,-1,-2,10,1e-35,5,7,4,3208.205,6,-7,12,1.000005,-5,-6,19,0.3484848,8,12,21,0.1905,-8,9,33,2140.25,-9,10,50,0.2916667,-10,11,30,1.708333,-11,-12,21,0.4305,13,-15,16,0.775,-13,-14],[-0.024705,0.015327,-0.019144,-0.033955,0.028149,-0.010384,0.0019236,-0.0058895,-0.0035255,-0.067341,0.015936,-0.0015359,-0.0025247,0.0075996,-0.0091291]],[[27,0.8166667,1,3,49,0.225,2,-3,19,0.4083333,-1,-2,13,1e-35,4,5,10,0.03015152,-4,-5,19,0.2928571,6,10,6,6.5,7,8,9,5.058348,-6,-7,36,9.55,-8,9,13,0.1855981,-9,-10,16,0.55,11,13,6,34.5,-11,12,16,0.2678571,-12,-13,10,0.01002513,-14,-15],[-0.026574,-0.0046062,0.030283,0.043355,-6.0114e-05,0.00098549,-0.030795,-0.015107,-0.014878,0.020716,-0.01489,-0.039504,0.013645,0.01312,0.0036183]],[[31,0.8444444,1,13,6,16.5,2,-13,9,4.997954,3,-12,26,0.331625,4,7,10,0.5601047,5,-4,6,4.5,-1,6,33,3906.75,-2,-3,33,1204.25,8,11,34,86.33333,9,10,4,1369.5,-5,-6,4,1642.0,-7,-8,4,2753.5,-9,12,32,0.5425725,-10,-11,28,0.23775,-14,-15],[-0.0021872,-0.020262,-0.0012737,0.0061804,0.025068,-0.020333,-0.048033,0.0080952,0.02265,-0.018575,0.014234,-0.034521,-0.028793,0.0024416,0.016575]],[[27,0.8166667,1,4,49,0.225,2,-4,20,-2.008029,-1,3,32,0.8843367,-2,-3,8,1e-35,-5,5,31,0.8444444,6,11,6,16.5,7,-11,11,0.5609234,8,10,40,1e-35,9,-8,13,0.400945,-6,-7,4,1951.0,-9,-10,16,0.55,-12,12,6,4.5,-13,13,19,0.5916667,-14,-15],[-0.025713,-0.0001487,-0.084875,0.028689,0.044075,-0.012504,0.013745,0.0052126,0.0039207,-0.017043,-0.027242,-0.0078876,-0.00052198,0.0055239,0.016367]],[[24,-3.815638,-1,1,8,1.243645,2,4,12,1.000005,3,-4,0,0.321,-2,-3,49,0.2916667,5,13,12,0.1281572,-5,6,12,1.000005,7,10,33,7546.5,8,-9,25,-1.246699,-6,9,12,0.7328118,-7,-8,40,1e-35,11,-13,34,140.125,12,-12,35,4.55,-10,-11,2,18.5,-14,-15],[-0.024607,0.033106,0.0096781,-0.011823,-0.018201,0.0036351,-0.0075377,0.0032272,0.017697,-0.032668,0.015351,-0.04008,-0.0028336,0.024006,-0.00099389]],[[31,0.8444444,1,10,6,16.5,2,-10,21,0.0375,3,4,33,1478.167,-1,-2,30,3.708333,5,-9,21,0.1905,6,8,20,-3.33106,-3,7,10,0.3550148,-4,-5,33,2130.25,-6,9,50,0.4142857,-7,-8,16,0.55,11,12,6,34.5,-11,-12,10,1e-35,-13,13,6,4.5,-14,-15],[-0.026621,-0.005114,0.020949,-0.0082686,0.0040209,0.00026253,-0.075229,0.014609,-0.019178,-0.027569,-0.014003,0.0059323,0.015929,-0.0023072,0.0062237]],[[13,1e-35,-1,1,20,-3.827919,-2,2,15,-1.204846,3,13,12,1.002199,4,-13,34,172.875,5,11,4,7642.5,6,-9,42,0.7083333,-3,7,13,0.2365123,-4,8,4,1868.035,-5,9,37,1.291667,10,-8,6,1e-35,-6,-7,4,2208.5,-10,12,25,-1.339083,-11,-12,13,0.2135377,-14,-15],[0.027908,-0.023839,0.027237,0.004222,0.0061689,-0.039804,-0.011491,0.001239,-0.020348,-0.04307,0.014896,0.00264,-0.0089313,0.028344,0.0026409]],[[31,0.775,1,8,21,0.0375,2,4,9,4.154985,3,-3,21,0.0325,-1,-2,21,0.276,5,6,21,0.2695,-4,-5,21,0.2815,-6,7,11,0.4890029,-7,-8,16,0.55,9,13,24,-1.090849,-9,10,20,-1.336126,-10,11,4,1878.5,-11,12,4,3642.697,-12,-13,13,1e-35,-14,-15],[-0.0066444,-0.038063,-0.035813,-0.0023282,-0.053122,0.045487,0.0071915,-0.0070727,-0.023023,0.037834,0.038842,-0.038194,-0.0041339,0.041184,0.004549]],[[28,0.1494444,1,10,20,-2.428901,2,4,21,0.0195,3,-3,34,440.25,-1,-2,16,0.9,-4,5,12,0.1548128,-5,6,14,699.5,-6,7,39,1.583333,8,-10,12,0.6131776,-7,9,37,1.291667,-8,-9,12,0.760496,11,13,23,7.5,12,-13,32,0.4505639,-11,-12,21,0.2315,-14,-15],[-0.024749,0.029988,-0.0055036,-0.0065552,-0.011798,0.014526,0.0073741,0.00016004,-0.037122,0.0024172,-0.00043909,-0.02194,0.011659,0.0070123,0.024177]],[[10,0.01507576,1,2,13,1e-35,-1,-2,9,5.160447,3,13,33,2665.167,4,11,4,7184.797,5,-10,38,0.225,6,10,20,-2.052514,7,9,15,-3.007197,8,-5,9,2.676175,-3,-4,21,0.6715,-6,-7,13,0.4662805,-8,-9,12,1.038223,12,-13,34,175.1667,-11,-12,25,-3.040245,-14,-15],[0.042502,0.0046617,0.00059657,-0.013893,-0.024151,-0.00021543,-0.049728,-0.0027119,0.024881,-0.014675,-0.013325,0.0049347,-0.013985,0.0012154,-0.039179]],[[28,0.1305556,1,12,12,1.002199,2,10,36,7.55,3,7,4,4812.67,4,5,20,-2.682292,-1,-2,5,8.5,6,-5,12,0.5393745,-3,-4,4,2658.589,8,9,21,0.1005,-6,-7,0,0.243,-8,-9,37,1.775,-10,11,39,4.366667,-11,-12,13,0.2365123,13,-15,21,0.2315,-13,-14],[-0.0098228,0.0027349,-0.027168,-0.0040161,-0.00054765,-0.016441,-0.062115,0.033571,0.0075828,-0.0035404,-0.044837,-0.01017,0.0065284,0.021652,-0.0014345]],[[13,1e-35,1,2,15,-4.863332,-1,-2,31,0.8444444,3,11,30,4.708333,4,-11,21,0.0605,5,8,9,3.906749,6,-6,21,0.0545,7,-5,33,1088.25,-3,-4,0,0.509,9,10,44,0.9444444,-7,-8,13,0.249118,-9,-10,16,0.775,12,-15,10,0.1051316,-12,13,7,4.5,-13,-14],[-0.0052304,0.038744,-0.022263,-0.00041159,-0.027344,-0.029694,-0.00048203,-0.022594,-0.00090015,0.014471,-0.025933,0.0037418,-0.027112,-0.0013599,0.0047944]],[[28,0.1494444,1,12,20,-2.662047,2,5,6,14.5,3,-4,14,3699.5,4,-3,0,0.2826667,-1,-2,33,5410.25,6,-12,33,611.125,-5,7,41,0.7083333,8,11,11,0.3628258,9,10,40,1e-35,-6,-7,40,0.2111111,-8,-9,11,0.3628258,-10,-11,11,0.2168751,13,-15,21,0.276,-13,-14],[-0.017286,-0.0023592,0.0098456,-0.028684,0.0068789,-0.012082,0.003936,0.0064575,-0.01251,-0.019961,0.0011911,0.0068417,0.0075314,0.026541,-0.0017547]],[[15,-1.204846,1,13,27,0.8166667,2,6,49,0.225,3,-5,19,0.4083333,-1,4,32,0.8645105,5,-4,34,34.5,-2,-3,13,1e-35,7,8,15,-3.995589,-6,-7,31,0.8444444,9,10,30,4.708333,-8,-9,16,0.55,11,-13,24,-1.459038,-10,12,38,0.3666667,-11,-12,13,0.1203774,-14,-15],[-0.02315,-0.052079,0.0012491,-0.074115,0.026004,9.9304e-05,0.041985,-0.0012389,-0.025344,-0.041388,-0.0088361,0.01198,0.0042281,0.034255,0.0050589]],[[15,-1.204846,1,13,12,1.002199,2,11,13,0.003650096,3,4,25,-1.120579,-1,-2,34,172.875,5,9,4,7642.5,6,8,9,4.404602,7,-5,49,0.2916667,-3,-4,6,18.5,-6,-7,4,2186.5,-8,10,25,-1.282704,-9,-10,50,0.5357143,-11,12,39,4.708333,-12,-13,12,0.6391199,-14,-15],[-0.0099835,0.022974,-0.00056138,0.024592,-0.020248,-0.028407,-0.0071151,-0.040112,0.013536,0.001586,0.0019514,-0.029898,-0.008615,-0.0024246,0.023678]],[[31,0.775,1,9,6,16.5,2,-9,27,0.8166667,3,4,22,0.8867521,-1,-2,6,3.5,-3,5,2,14.5,-4,6,23,9.5,-5,7,12,0.5909979,8,-8,50,0.9166667,-6,-7,16,0.55,10,11,6,34.5,-10,-11,6,3.5,-12,12,19,0.4365079,13,-15,20,-1.574979,-13,-14],[-0.024295,0.047864,0.0019817,-0.02722,-0.0079772,-0.017102,0.045904,0.003656,-0.026644,-0.012349,0.0058856,-0.0020831,-0.0073067,0.0069883,0.0098607]],[[28,0.1470833,1,9,12,1.000005,2,-9,36,7.55,3,6,4,4812.67,-1,4,38,1.633333,5,-4,31,0.8444444,-2,-3,4,2658.589,-5,7,6,18.5,-6,8,31,0.7083333,-7,-8,12,0.7328118,10,13,23,7.5,11,-13,5,8.5,12,-12,4,1878.5,-10,-11,21,0.2315,-14,-15],[0.0005838,-0.023823,-0.0076276,0.0026116,-0.038502,0.012207,-0.032298,0.003537,-0.0098149,0.0075034,-0.025517,0.0047394,0.01165,0.0055066,0.020332]],[[27,0.8166667,1,5,49,0.225,2,-5,9,3.69377,3,-4,4,14196.17,4,-3,12,0.8385067,-1,-2,8,1e-35,-6,6,19,0.3484848,7,10,30,4.125,8,-10,12,1.000005,-7,9,42,1.9,-8,-9,28,0.1305556,11,-15,16,0.9,12,-14,4,1878.5,-11,13,2,18.5,-12,-13],[0.0012651,-0.01864,-0.044398,-0.032745,0.023575,0.039234,0.00075966,-0.017533,0.0012172,-0.011514,0.026987,-0.029258,-0.0046451,0.0032,0.0099245]],[[28,0.1229167,1,10,12,1.002199,2,8,25,-1.246699,3,6,40,0.8452381,4,-4,12,0.6306539,-1,5,37,1.916667,-2,-3,9,2.301448,7,-7,12,0.9951441,-5,-6,50,0.4142857,-8,9,40,0.3666667,-9,-10,12,0.6479745,11,13,38,0.2916667,12,-13,37,4.416667,-11,-12,24,-1.315304,-14,-15],[0.0086927,0.0017451,-0.031341,0.01023,-0.0021811,0.019773,-0.014306,0.0089952,-0.02814,-0.0070374,-0.013366,0.022278,0.0090307,0.0042083,0.016254]],[[15,-1.204846,1,13,27,0.8166667,2,5,37,0.6333333,3,-4,35,3.633333,4,-3,36,3.775,-1,-2,13,1e-35,6,7,15,-3.878563,-5,-6,31,0.8444444,8,10,6,16.5,9,-9,44,0.4142857,-7,-8,6,2.5,-10,11,19,0.6904762,-11,12,6,21.5,-12,-13,12,0.5306474,-14,-15],[-0.039383,0.006714,0.012639,-0.0191,-0.00056873,0.041926,-4.3981e-05,-0.012368,-0.024895,-0.0057757,0.0020358,0.0066773,0.029772,-0.0058724,0.020687]],[[15,-1.204846,1,13,49,0.875,2,12,21,1e-35,3,4,9,3.69377,-1,-2,33,7546.5,5,-11,18,0.6333333,6,9,31,0.55,7,-6,24,-1.636499,-3,8,26,0.2721667,-4,-5,12,1.000005,10,11,12,0.9951441,-7,-8,34,140.125,-9,-10,2,21.5,-12,-13,12,0.5306474,-14,-15],[-0.0078844,-0.031749,0.0015051,-0.037985,-0.00082229,0.0082958,-0.0017764,0.018967,-0.00057862,-0.022046,0.01258,0.022917,-0.0095402,-0.0056947,0.020074]],[[28,0.12775,1,13,9,5.160447,2,-13,25,-1.246699,3,11,40,0.8452381,4,10,12,0.6306539,5,6,12,0.2624635,-1,-2,37,1.291667,7,9,38,0.45,8,-5,14,1050.5,-3,-4,12,0.8166641,-6,-7,11,0.3628258,-8,-9,24,-1.090849,-10,12,10,0.1100847,-11,-12,11,0.2554128,-14,-15],[-0.002096,0.015235,-0.0072816,0.022347,-0.015469,-0.014089,-0.040655,0.01437,-0.0042772,-0.0060287,0.0085817,-0.010736,-0.022494,0.0076417,-0.0027419]],[[13,1e-35,1,2,15,-3.916447,-1,-2,31,0.775,3,11,6,16.5,4,-11,9,5.160447,5,-10,10,0.6005319,6,-9,21,0.1905,-3,7,32,0.5986111,8,10,6,4.5,9,-6,13,0.06272871,-4,-5,26,0.2062,-7,-8,16,0.55,-12,12,6,4.5,-13,13,19,0.5916667,-14,-15],[0.0027007,0.041699,-0.0068155,0.016229,-0.0026791,-0.022635,0.06643,0.0086644,0.0074981,-0.032072,-0.02471,-0.0067605,-0.0022714,0.003403,0.013455]],[[28,0.12775,1,11,12,1.000005,2,-11,25,-1.246699,3,9,39,9.833333,4,8,12,0.7097096,5,6,26,0.4325,-1,-2,37,1.916667,7,-5,38,0.45,-3,-4,11,0.3628258,-6,-7,9,2.301448,10,-10,12,0.9951441,-8,-9,9,0.7587738,12,13,4,1455.5,-12,-13,11,0.2554128,-14,-15],[0.0097124,-0.0093895,0.0092253,-0.017086,-0.034296,0.015745,-0.005247,-0.0021286,0.0205,-0.013408,-0.008978,0.025773,0.0066961,0.0041305,-0.0088003]],[[10,0.01507576,1,3,13,1e-35,-1,2,28,0.28125,-2,-3,34,175.1667,4,8,4,6201.5,5,-8,38,0.225,6,-7,24,-2.043088,7,-6,9,5.160447,-4,-5,4,2658.589,-9,9,13,0.2036747,10,13,37,3.55,11,12,5,7.5,-10,-11,4,4812.67,-12,-13,25,-1.282704,-14,-15],[0.038681,0.0016273,0.01649,-0.0071036,-0.039014,4.5694e-05,0.010344,-0.013773,-0.039167,0.012064,-0.0085047,-0.041819,-0.0037217,0.01882,0.003857]],[[15,-1.204846,1,13,49,0.875,2,11,27,0.8166667,3,4,9,3.906749,-1,-2,33,7546.5,5,9,18,0.6333333,6,-7,19,0.5227273,7,8,32,0.8699678,-3,-4,6,13.5,-5,-6,26,0.05216667,-8,10,13,0.3579015,-9,-10,4,11021.14,12,-13,26,0.2545833,-11,-12,13,0.2135377,-14,-15],[-0.0080486,-0.032246,0.0014594,-0.034136,0.0022487,0.021624,-0.0020676,0.057828,0.00039516,0.028067,0.019597,-0.036356,-0.016042,0.025527,0.00091639]],[[31,0.775,1,-15,30,4.708333,2,-14,21,0.1055,3,9,21,0.0935,4,7,21,0.0865,-1,5,21,0.0895,-2,6,36,5.9,-3,-4,0,0.491,-5,8,21,0.1045,-6,-7,21,0.1385,-8,10,21,0.1905,-9,11,14,1885.5,-10,12,50,0.1833333,-11,13,11,0.4890029,-12,-13],[-0.0072888,0.042793,-0.011096,0.042428,-0.035919,0.031027,-0.037536,0.012785,-0.011782,-0.003022,-0.043262,0.013862,-0.011005,-0.022467,0.0023754]],[[15,-1.204846,1,13,49,0.875,2,11,27,0.8166667,-1,3,11,0.6446022,4,8,34,26.0,-2,5,40,1e-35,6,-6,13,0.4281627,7,-5,50,0.1833333,-3,-4,5,8.5,9,-10,4,1973.5,10,-9,34,134.75,-7,-8,2,21.5,12,-13,21,0.2545,-11,-12,13,0.3622282,-14,-15],[-0.011067,0.029571,0.0094659,-0.014739,0.010358,0.0019752,0.009096,-0.039664,-0.020804,0.0054756,0.022747,-0.03477,-0.009524,0.020793,-0.0028374]],[[13,1e-35,1,2,15,-3.916447,-1,-2,20,-2.428901,3,4,9,5.160447,-3,-4,28,0.28125,5,-15,13,0.6498717,6,10,16,0.3666667,-5,7,24,-1.090849,-6,8,39,3.1,9,-9,37,1.916667,-7,-8,5,6.5,11,13,23,7.5,12,-12,4,2208.5,-10,-11,4,7751.436,-13,-14],[0.0019007,0.04055,-0.0035684,-0.034535,-0.01728,0.00013429,0.0090336,-0.019789,0.010229,0.0020674,-0.032084,0.0053183,0.0082336,-0.0094791,0.013328]],[[8,1e-35,-1,1,33,5410.25,2,10,24,-1.892248,3,8,6,5.5,4,7,0,0.287,-2,5,23,7.5,-3,6,2,14.5,-4,-5,2,15.5,-6,-7,28,0.28125,9,-10,2,4.5,-8,-9,5,7.5,11,13,2,22.5,-11,12,22,0.9428105,-12,-13,12,0.8091519,-14,-15],[0.034995,-0.0069861,0.011047,-0.025053,0.0066773,-0.0301,-0.0087434,0.012847,-0.00071009,0.014416,0.025315,0.01219,-0.01478,0.0083679,-0.012229]],[[12,1.117603,1,13,15,-1.204846,2,12,25,-2.971001,-1,3,9,5.058348,4,-11,13,1e-35,5,6,25,-1.777343,-2,-3,34,172.875,7,9,4,7642.5,-4,8,6,18.5,-5,-6,4,2208.5,-7,10,12,0.900201,-8,11,34,183.1667,-9,-10,12,0.6391199,-12,-13,39,4.55,-14,-15],[0.013941,-0.047351,0.022559,-0.00078642,-0.026821,-0.0052608,-0.034949,0.0058679,0.014218,-0.004618,-0.031817,-0.0031651,0.021453,-0.035859,-0.0032932]],[[31,0.775,1,11,6,16.5,2,-11,6,4.5,3,9,40,0.2361111,4,8,12,0.5691431,-1,5,50,0.2361111,-2,6,32,0.4960317,-3,7,34,140.125,-4,-5,11,0.3628258,-6,-7,2,19.5,10,-10,7,1e-35,-8,-9,16,0.55,-12,12,6,3.5,-13,13,19,0.4365079,-14,-15],[0.0073987,0.0079414,-0.036303,0.0073092,-0.023287,0.0091572,-0.01231,-2.8741e-10,-0.02699,0.0029586,-0.024135,-0.006926,-0.0028295,-0.00038584,0.0089534]],[[27,0.8166667,1,6,37,0.3666667,2,5,35,2.9,3,4,47,0.7083333,-1,-2,19,0.422619,-3,-4,38,2.583333,-5,-6,8,1e-35,-7,7,33,5410.25,8,11,16,0.3666667,-8,9,31,0.8444444,10,-11,30,3.708333,-9,-10,5,7.5,-12,12,13,0.1915685,-13,13,38,9.75,-14,-15],[-0.0020077,-0.048368,-0.0033935,0.024478,-0.013564,-0.061114,0.033375,-0.018436,-0.00095965,-0.01808,0.002086,0.013134,-0.011957,-0.0013671,0.022883]],[[28,0.12775,1,11,25,-2.971001,-1,2,9,5.229517,3,-11,21,0.6715,4,-10,25,-1.246699,5,9,39,9.833333,6,-6,12,0.6306539,-2,7,50,0.4142857,-3,8,14,1220.5,-4,-5,24,-1.090849,-7,10,13,0.5313737,-8,-9,19,0.4365079,12,-15,21,0.2005,-12,13,12,0.6525035,-13,-14],[0.01243,0.0066104,0.011749,-0.03289,-0.012569,0.0076475,-0.0055737,0.0081768,-0.0098208,-0.042967,-0.036299,-0.0040849,-0.0067661,0.014359,0.0089093]],[[28,0.079,1,9,25,-1.246699,2,-9,33,1838.25,3,-8,13,0.3794407,4,8,34,140.125,5,7,33,1052.167,6,-3,34,79.25,-1,-2,35,7.875,-4,-5,34,168.8333,-6,-7,13,0.3534866,10,12,26,0.230125,-10,11,14,3119.5,-11,-12,5,7.5,13,-15,34,315.25,-13,-14],[0.00066179,-0.034824,0.010527,-0.043683,0.010581,0.002318,0.027329,0.0062374,-0.0060703,0.0011918,0.018132,0.0053894,-0.017819,0.010535,0.0049351]],[[15,-1.204846,1,13,20,-4.234924,-1,2,21,0.6715,3,12,49,0.875,4,9,33,7546.5,5,-7,18,0.4142857,-2,6,16,0.3666667,-3,7,24,-1.372948,8,-6,30,14.55,-4,-5,2,21.5,10,-11,21,0.2545,11,-10,4,8898.5,-8,-9,4,1878.5,-12,-13,13,0.4705229,-14,-15],[-0.023947,0.013076,-0.017758,-0.0024881,-0.044088,0.0019572,0.010792,0.025654,-0.0047352,-0.033074,-0.0090005,-0.083012,0.01247,0.017384,-0.0055062]],[[12,1.000005,1,-15,13,0.003650096,2,3,15,-3.983797,-1,-2,37,2.585714,4,12,4,1877.898,5,6,37,1.45,-3,-4,34,67.16667,7,9,2,15.5,8,-7,4,3720.5,-5,-6,34,92.625,-8,10,34,97.75,11,-11,40,0.7321429,-9,-10,4,1489.5,-12,13,16,0.7083333,-13,-14],[-0.00068584,0.032091,0.0078841,-0.017129,-0.040147,-0.0069268,-0.004722,0.012951,-0.00813,-0.047815,-0.0007177,-0.039518,-0.0076142,0.0086662,-0.0063037]],[[15,-1.204846,1,13,12,1.000005,2,-13,36,7.55,3,10,12,0.7646596,4,7,5,7.5,5,-4,39,9.583333,-1,6,11,0.3628258,-2,-3,35,7.291667,8,-8,39,3.1,9,-7,26,0.07116667,-5,-6,4,2658.589,-9,11,6,18.5,-10,12,31,0.7083333,-11,-12,12,0.5306474,-14,-15],[-0.0031596,-0.0083915,-0.027605,0.0036755,-0.033396,-0.0011063,0.0072793,-0.010704,-0.031503,0.01018,-0.032072,0.0029492,-0.0066806,-0.0046884,0.016909]],[[12,1.117603,1,13,15,-1.204846,2,12,34,850.3333,3,6,24,-2.728472,4,-4,6,10.5,5,-3,0,0.4105556,-1,-2,0,0.3268889,-5,7,5,8.5,8,11,2,24.5,-6,9,22,0.9428105,-7,10,19,0.6458333,-8,-9,19,0.3038462,-10,-11,13,0.2526651,-12,-13,42,2.267857,-14,-15],[-0.0097492,0.005962,-0.023208,0.0001728,0.037881,0.017353,0.016167,-0.02831,0.026968,-0.032211,0.018217,0.022765,0.00034789,-0.022193,0.0085469]],[[33,5410.25,1,10,28,0.18875,2,8,12,1.000005,3,6,25,-1.246699,4,5,40,0.8452381,-1,-2,12,0.7215361,-3,-4,34,140.125,-5,7,33,1852.25,-6,-7,12,0.736909,-8,9,24,-1.383994,-9,-10,19,0.8660714,11,-15,29,0.2916667,-11,12,50,0.6333333,13,-14,31,0.8444444,-12,-13],[-0.0016614,0.0082542,-0.0075302,0.0011308,-0.001612,-0.045802,-0.012086,-0.0032697,0.0047611,0.022511,0.011973,-0.050572,-0.0049827,0.00039508,0.02326]],[[13,1e-35,1,2,15,-3.916447,-1,-2,31,0.775,3,11,7,1.5,4,8,21,0.2005,5,6,15,-3.520595,-3,-4,32,0.6090353,-5,7,26,0.2062,-6,-7,29,0.775,9,10,2,16.5,-8,-9,18,0.3666667,-10,-11,16,0.55,12,-15,2,17.5,13,-14,4,1878.5,-12,-13],[0.001,0.038812,0.00036997,-0.010494,-0.00089853,0.073858,0.0077181,-0.011837,0.0099799,0.054866,-0.022798,0.014079,-0.031304,-0.0021992,0.0031584]],[[28,0.079,1,6,12,1.002199,2,5,34,55.25,3,-4,4,1555.5,-1,4,5,6.5,-2,-3,50,0.4142857,-5,-6,12,0.6479745,7,11,5,7.5,8,-11,34,315.25,9,-10,4,1878.5,-7,10,2,17.5,-8,-9,5,6.5,12,13,8,2.266454,-12,-13,19,0.5505051,-14,-15],[0.0023209,-0.033828,-0.0039923,0.0002519,0.0085017,-0.01545,0.00091512,-0.035271,-0.012112,0.010116,0.0048966,0.016847,0.0048196,-0.0045767,0.010624]],[[33,5630.25,1,10,28,0.18875,2,8,15,-6.855403,-1,3,18,0.4642857,-2,4,25,-3.134151,-3,5,9,5.229517,6,-7,21,0.6715,-4,7,4,1878.5,-5,-6,13,0.2297853,9,-10,24,-1.180848,-8,-9,19,0.6904762,11,-15,29,0.2916667,-11,12,37,8.833333,13,-14,24,-1.511471,-12,-13],[-0.021322,0.018309,0.013568,-0.0015875,-0.080921,0.01042,-0.034228,0.0057262,0.027695,-0.0025547,0.011339,-0.017109,0.0009863,0.036566,0.022786]],[[13,1e-35,1,2,25,-0.9187054,-1,-2,31,0.775,3,10,6,16.5,4,-10,21,0.0605,5,7,14,1091.5,-3,6,21,0.0545,-4,-5,0,0.509,8,-9,6,4.5,9,-8,13,0.08321336,-6,-7,16,0.55,-11,11,6,3.5,-12,12,19,0.4365079,-13,13,9,0.8735315,-14,-15],[-0.0068719,0.031443,-0.023768,2.8042e-05,-0.022723,0.0092425,-0.0021446,-0.018651,0.0071248,-0.022391,-0.0063689,-0.0036339,-0.0006645,0.01419,0.0041591]],[[33,5630.25,1,12,12,1.002199,2,11,9,1e-35,3,4,0,0.321,-1,-2,34,57.25,5,6,33,956.25,-3,-4,34,92.625,-5,7,34,165.6667,8,-10,12,0.7486747,9,-9,33,1282.125,-6,10,37,1.225,-7,-8,36,9.416667,-11,-12,19,0.6904762,13,-15,29,0.2916667,-13,-14],[0.021079,-0.00070813,-0.0035781,-0.024348,0.0070644,0.0022947,-0.027752,-0.0067185,0.00066308,0.0019179,-0.0054396,-0.036917,0.010904,-0.002736,0.02223]],[[27,0.8166667,1,5,37,0.3666667,2,4,34,60.25,3,-3,35,2.9,-1,-2,4,14999.83,-4,-5,26,0.6715,6,13,8,1e-35,-6,7,16,0.3666667,-7,8,31,0.8444444,9,10,6,16.5,-8,-9,6,3.5,-10,11,19,0.5227273,-11,12,10,0.1900413,-12,-13,4,1878.5,-14,-15],[-0.0441,0.013537,0.010561,-0.012524,-0.05435,0.031285,-0.014391,-5.1651e-05,-0.022634,-0.0034363,0.0023174,0.015156,0.00023582,-0.083312,0.011181]],[[13,1e-35,1,2,15,-3.916447,-1,-2,27,0.8166667,3,10,49,0.875,4,-10,32,0.8760965,5,8,29,0.55,-3,6,0,0.4605556,-4,7,32,0.4096737,-5,-6,0,0.481,9,-9,15,-3.22343,-7,-8,21,0.6715,11,13,21,0.6605,-11,12,4,1489.5,-12,-13,4,1878.5,-14,-15],[0.00086181,0.037778,-0.013926,0.035008,0.01664,-0.016464,0.09297,-0.043708,-0.075144,0.03304,0.00018861,-0.041092,0.031661,-0.080024,0.010396]],[[33,5630.25,1,9,12,1.000005,2,8,8,1e-35,-1,3,13,0.7122632,-2,4,5,8.5,5,7,4,1930.5,-3,6,6,17.5,-4,-5,4,10781.35,-6,-7,32,0.8066239,-8,-9,5,7.5,10,12,2,22.5,-10,11,22,0.9622507,-11,-12,12,0.8091519,13,-15,38,9.75,-13,-14],[0.044118,0.00064336,0.003073,-0.026834,0.00086329,0.012919,-0.014217,-0.0039176,-0.027319,0.022482,0.0098903,-0.021447,4.4133e-05,0.022008,-0.011759]],[[33,5630.25,1,9,20,-4.527063,-1,2,32,0.6757353,3,5,34,57.25,4,-4,33,956.25,-2,-3,26,0.24925,-5,6,26,0.2998333,7,8,2,31.5,-6,-7,26,0.3095833,-8,-9,19,0.6904762,10,-15,5,7.5,11,13,2,22.5,-10,12,22,0.9428105,-11,-12,12,0.8091519,-13,-14],[-0.035507,-0.0013979,-0.020995,0.0016685,-0.007673,0.013825,-0.01503,-0.06223,0.00056567,0.021756,0.008205,-0.018002,0.0048616,-0.013624,0.021461]],[[33,5630.25,1,10,28,0.27125,2,9,20,-4.527063,-1,3,25,-3.134151,-2,4,12,0.2841895,5,8,5,8.5,-3,6,4,10647.5,7,-6,21,0.4315,-4,-5,39,3.291667,-7,-8,24,-1.372948,-9,-10,19,0.6904762,11,-15,5,7.5,12,13,6,22.5,-11,-12,4,6784.341,-13,-14],[-0.035353,0.012013,-0.015408,0.015983,-0.011647,-0.014304,-0.0044839,0.00084251,0.0011148,0.022787,0.015872,-0.0049512,-0.037813,-0.00059849,0.021097]],[[33,5630.25,1,10,26,0.05925,2,-10,26,0.05425,3,8,20,-2.924805,4,7,40,0.4142857,5,6,13,0.2836569,-1,-2,11,0.3628258,-3,-4,20,-2.788822,-5,-6,2,2.5,-7,9,34,113.1667,-8,-9,19,0.8660714,11,-15,29,0.2916667,-11,12,37,8.833333,13,-14,42,5.775,-12,-13],[-0.034708,-0.0049253,0.0076483,-0.02036,0.038015,-0.00070804,0.061312,0.022812,-0.039437,8.9858e-05,0.0096986,-0.0072851,0.015877,0.035278,0.02128]],[[12,1.117603,1,13,33,5630.25,2,9,28,0.27125,3,8,20,-4.527063,-1,4,25,-2.971001,-2,5,9,5.229517,6,-6,13,0.7122632,-3,7,4,7642.5,-4,-5,24,-1.372948,-7,-8,19,0.6904762,10,-13,0,0.341,11,12,26,0.08325,-9,-10,37,5.416667,-11,-12,39,4.55,-14,-15],[-0.034427,0.01038,-0.000204,-0.00075862,-0.017025,-0.031717,0.0013431,0.023812,0.035495,-0.0064598,-0.0018167,0.015805,0.020408,-0.031919,-0.0023399]],[[19,0.3484848,1,6,6,5.5,-1,2,20,-1.214836,3,5,23,9.5,4,-4,25,-2.431094,-2,-3,18,0.7083333,-5,-6,6,3.5,7,8,0,0.197,-7,-8,10,0.2050641,9,12,2,19.5,-9,10,6,14.5,-10,11,19,0.6458333,-11,-12,25,-0.124227,13,-15,3,1.5,-13,-14],[0.00097973,0.0043058,-0.017225,0.00014902,-0.067667,0.0085233,0.0052569,-0.010469,0.012912,-0.0083173,0.0010016,0.019735,0.011007,-0.0088087,0.012434]],[[12,1.117603,1,13,15,-1.204846,2,12,16,0.2678571,3,5,6,13.5,-1,4,6,65.5,-2,-3,36,7.55,6,7,32,0.6193064,-4,-5,4,2658.589,8,10,32,0.6160256,9,-8,20,-2.14431,-6,-7,0,0.243,11,-11,26,0.2621667,-9,-10,13,0.2135377,-12,-13,39,6.366667,-14,-15],[0.059701,-0.054678,0.0082019,0.00038787,-0.0048298,-0.023931,0.037149,-0.04668,0.027237,-0.056643,0.003709,0.021508,0.00049548,-0.027541,-0.00043726]],[[13,1e-35,1,2,15,-3.916447,-1,-2,21,0.6715,3,-15,21,0.6605,4,-14,21,0.6555,5,-13,19,0.3484848,6,12,25,-1.411798,-3,7,21,0.559,8,-9,6,5.5,9,11,37,1.291667,-4,10,40,0.4142857,-5,-6,23,8.5,-7,-8,6,3.5,-10,13,10,0.2050641,-11,-12],[0.00044737,0.037079,0.0033628,-0.0064957,-0.014716,0.0068937,-0.017055,-0.0032824,0.015419,-0.0056654,0.0071713,-0.0026788,-0.043063,0.019468,-0.034883]],[[28,0.079,1,6,11,-0.5345833,-1,2,13,0.04370614,3,4,40,0.7321429,-2,-3,36,7.633333,-4,5,4,2604.5,-5,-6,4,1489.5,7,8,20,-2.428901,-7,-8,34,67.16667,-9,9,19,0.5669643,10,-15,26,0.2721667,11,13,26,0.2691667,12,-12,0,0.8442222,-10,-11,30,3.9,-13,-14],[-0.0087643,-0.0055622,0.024204,-0.0026139,-0.031005,0.0072365,-0.0054019,0.022374,-0.014166,-1.6351e-05,-0.012513,-0.047389,0.011535,-0.0018145,0.00884]],[[13,1e-35,1,2,39,9.45,-1,-2,33,5630.25,3,12,11,-1.285069,4,5,18,0.7083333,-3,-4,18,0.4142857,-5,6,4,17894.97,7,11,49,0.4166667,-6,8,21,0.2545,9,-10,35,6.291667,-7,10,24,-1.741919,-8,-9,23,8.5,-11,-12,5,7.5,-13,13,4,6784.341,-14,-15],[-0.00057682,0.034347,0.00089505,-0.01951,0.012912,-0.00075327,0.022158,-0.012385,0.011786,-0.03565,-0.034092,-0.0047875,0.010202,-0.03525,0.0015764]],[[31,0.775,1,2,6,16.5,-1,-2,16,0.55,3,9,24,-1.180848,-3,4,20,-1.231714,-4,5,4,1921.5,-5,6,4,3642.697,-6,7,19,0.4365079,8,-9,21,0.2145,-7,-8,6,3.5,10,12,0,0.407,-10,11,19,0.6458333,-11,-12,19,0.4365079,13,-15,20,-1.574979,-13,-14],[-0.00045397,-0.021328,-0.02284,0.022106,0.028363,-0.036724,0.060652,0.0031569,-0.010815,0.00084692,-0.0044849,-0.033781,-0.0067826,0.0054525,0.0078713]],[[12,1.117603,1,13,33,5630.25,2,5,20,-4.527063,-1,3,16,0.3666667,4,-4,48,0.6333333,-2,-3,19,0.6904762,6,-13,0,0.341,-5,7,37,4.633333,8,11,24,-3.3598,-6,9,20,-2.826004,-7,10,0,0.529,-8,-9,21,0.0225,-10,12,21,0.0525,-11,-12,42,2.267857,-14,-15],[-0.03286,-0.02121,0.034215,-4.7477e-05,0.022226,0.026565,-0.018503,0.013198,-0.004651,-0.053286,0.047064,0.0095732,0.019227,-0.020093,0.0098733]],[[28,0.079,1,12,25,-1.246699,2,-12,4,1766.005,3,8,37,1.45,4,5,22,0.644958,-1,-2,4,1296.5,-3,6,22,0.4907407,-4,7,34,128.125,-5,-6,37,1.916667,9,11,21,0.0935,-7,10,0,0.3557778,-8,-9,3,1.5,-10,-11,19,0.3484848,13,-15,26,0.2021667,-13,-14],[0.004542,0.038275,-0.044116,-0.037126,0.017431,-0.03015,0.007952,-0.023416,-6.4438e-05,0.0083682,-0.021371,-0.0052044,-0.0058211,0.0041077,0.0053563]],[[13,1e-35,1,2,39,9.45,-1,-2,27,0.8166667,3,10,37,0.3666667,4,6,35,2.9,5,-5,47,0.7083333,-3,-4,14,9183.0,7,-10,22,0.2649123,8,9,20,-2.26136,-6,-7,37,4.888889,-8,-9,31,0.8444444,11,12,6,21.5,-11,-12,16,0.7083333,-13,13,6,8.5,-14,-15],[0.00027292,0.032946,0.0015831,-0.046117,0.01005,-0.021235,0.046575,-0.017738,0.010825,-0.050362,-0.00049225,-0.024533,-0.0043784,-0.00081142,0.0073781]],[[13,0.003650096,1,3,25,-0.9187054,-1,2,3,1.5,-2,-3,20,-4.234924,-4,4,25,-2.971001,-5,5,13,0.8771067,6,12,15,-1.204846,7,11,11,-0.5345833,8,9,37,3.55,-6,-7,13,0.04370614,10,-10,21,0.0805,-8,-9,13,0.1203774,-11,-12,4,16347.0,13,-15,0,0.509,-13,-14],[-0.0084796,0.030337,0.0079615,-0.021706,0.010153,-0.001601,-0.018818,-0.0074944,0.017232,-0.0004596,0.02213,0.0030471,-0.016606,0.010824,-0.034514]],[[13,1e-35,1,2,15,-3.916447,-1,-2,33,5630.25,3,13,26,0.05925,4,7,4,825.5,-3,5,26,0.05425,-4,6,2,2.5,-5,-6,21,0.0935,8,9,32,0.5727513,-7,-8,26,0.09716667,-9,10,4,1155.0,11,12,37,1.291667,-10,-11,34,68.33333,-12,-13,24,-3.3598,-14,-15],[0.0014996,0.035361,-0.029595,-0.0015764,0.061329,-0.030649,0.0081186,-0.0022675,-0.021316,0.014558,-0.046939,-0.013389,0.0002112,0.029553,0.0035054]],[[28,0.079,1,8,11,-0.5345833,2,4,37,3.633333,3,-3,33,1171.167,-1,-2,13,0.04370614,-4,5,37,5.833333,-5,6,4,4918.5,7,-8,21,0.1145,-6,-7,4,1489.5,9,10,20,-2.428901,-9,-10,14,1989.5,11,12,38,5.875,-11,-12,19,0.5505051,-13,13,6,14.5,-14,-15],[-0.019782,-6.2168e-05,-0.025915,0.011996,-0.0019664,0.018231,-0.039675,0.018461,-0.004383,0.020779,-0.010587,0.014777,0.00081464,0.0011643,0.015001]],[[31,0.775,1,6,6,16.5,2,-6,6,5.5,-1,3,23,9.5,4,5,8,2.681335,-2,-3,12,0.7486747,-4,-5,16,0.55,7,13,24,-1.459038,-7,8,6,34.5,9,12,16,0.3666667,-8,10,7,4.5,11,-11,37,0.9444444,-9,-10,16,0.2678571,-12,-13,6,2.5,-14,-15],[0.000987,-0.03011,-0.008587,0.017648,-0.0030375,-0.020532,-0.034031,-0.0307,-0.00022153,-0.022484,0.012496,-0.033815,0.01259,-0.0038538,0.0044021]],[[27,0.8166667,1,10,43,0.4166667,2,6,34,34.5,3,4,35,2.9,-1,-2,9,3.69377,5,-5,38,0.6333333,-3,-4,5,7.5,7,9,32,0.6090353,8,-8,4,1280.5,-6,-7,5,9.5,-9,-10,21,0.6715,11,13,21,0.6605,-11,12,4,1489.5,-12,-13,4,1878.5,-14,-15],[-0.068998,0.010955,0.021432,-0.0021254,-0.019851,-0.036931,0.0067899,-0.024743,-0.065439,-0.014614,0.00031138,-0.040734,0.030937,-0.075747,0.011858]],[[13,1e-35,1,2,15,-3.916447,-1,-2,31,0.775,3,11,30,4.708333,4,10,16,0.6333333,-3,5,37,1.291667,-4,6,40,0.4142857,7,8,12,0.6658537,-5,-6,11,0.3628258,9,-9,30,1.708333,-7,-8,48,0.7083333,-10,-11,28,0.1808333,12,-15,16,0.7083333,13,-14,5,3.5,-12,-13],[0.0019037,0.034976,0.017916,-0.0037486,0.010954,-0.029506,0.013309,-0.0062624,-0.0083501,-0.020949,0.036546,-0.020164,-0.0015846,0.0017654,0.0081251]],[[12,1.117603,1,13,15,-1.204846,2,12,25,-2.971001,-1,3,9,5.229517,4,-11,22,0.9110672,-2,5,4,4863.385,-3,6,2,25.5,7,10,5,7.5,-4,8,20,-2.078332,9,-7,20,-3.33106,-5,-6,26,0.235125,-8,11,20,-1.710948,-9,-10,12,0.6525035,-12,-13,39,4.55,-14,-15],[0.010045,-0.00082953,-0.049179,0.014966,0.019305,-0.018599,0.014715,-0.010506,0.024907,-0.0005684,-0.03077,-0.0023395,0.017034,-0.028843,-0.0018285]],[[33,5630.25,1,9,12,1.000005,2,7,12,0.9951441,3,5,37,2.585714,-1,4,4,1878.5,-2,-3,10,0.1750706,6,-6,25,-1.120579,-4,-5,36,9.416667,8,-9,21,0.0225,-7,-8,19,0.6904762,10,-15,29,0.2916667,-10,11,50,0.7321429,12,13,31,0.6333333,-11,-12,37,8.833333,-13,-14],[-0.0015743,-0.025711,0.005069,-0.010569,0.027019,-0.0095194,-0.019907,-0.0016592,-0.034233,0.0082792,-0.046558,-0.0071137,-0.0004684,0.031648,0.018268]],[[33,5630.25,1,11,49,0.4166667,2,9,18,0.4142857,3,4,0,0.3826667,-1,-2,4,6201.5,5,7,34,275.25,-3,6,4,4744.56,-4,-5,34,195.25,8,-8,6,18.5,-6,-7,21,0.2545,10,-11,4,1823.5,-9,-10,19,0.6904762,12,-15,0,0.341,-12,13,42,5.775,-13,-14],[-0.025582,0.016442,0.00079386,-0.031228,0.001135,-0.018692,-0.0025004,0.0023726,0.03747,0.0052355,-0.034955,0.019759,-0.0013406,0.015847,0.01778]],[[31,0.775,1,10,30,4.708333,2,-10,21,0.0375,3,4,21,0.0315,-1,-2,10,0.4650581,5,-9,26,0.3095833,6,-8,26,0.2981667,7,9,21,0.276,8,-5,21,0.2695,-3,-4,14,1515.5,-6,-7,16,0.7083333,11,-15,10,0.1201093,12,13,50,0.5357143,-11,-12,7,4.5,-13,-14],[-0.0026365,-0.032424,-0.0022389,-0.054999,0.014316,0.0027598,-0.067073,0.0046323,0.0069996,-0.018295,0.017134,-0.0030197,-0.023456,-0.002438,0.0029429]],[[34,55.25,1,8,4,1555.5,2,4,24,-1.87115,3,-3,21,0.2685,-1,-2,2,17.5,5,7,4,3720.5,6,-6,4,1795.597,-4,-5,4,7859.55,-7,-8,34,92.625,-9,9,4,1296.5,10,12,35,4.9,-10,11,37,0.9444444,-11,-12,34,97.75,13,-15,39,8.8375,-13,-14],[-0.0011026,-0.03826,0.01435,-0.01165,-0.041216,-0.0019577,0.015101,-0.033221,0.0062421,-0.053166,0.022181,-0.02169,-0.00062848,-0.041079,0.00063298]],[[24,-1.372948,1,3,15,-3.092482,2,-3,12,0.857543,-1,-2,8,3.133687,4,11,13,0.2759574,5,9,39,3.225,6,8,50,0.4142857,-4,7,6,4.5,-5,-6,16,0.6333333,-7,-8,34,315.875,10,-11,20,-1.549274,-9,-10,20,-0.9375081,12,13,9,3.631477,-12,-13,19,0.4494949,-14,-15],[0.0033828,-0.0026818,-0.0053087,0.022038,-0.045968,-0.0022401,-0.0061364,0.014626,-0.070126,-0.0031515,0.010641,-0.0010536,0.020986,0.0069076,-0.021866]],[[28,0.079,1,10,25,-1.246699,2,-10,4,1766.005,3,9,37,1.45,4,6,22,0.644958,-1,5,23,5.5,-2,-3,23,5.5,7,-7,13,0.1945622,-4,8,22,0.4907407,-5,-6,37,1.916667,-8,-9,4,1489.5,11,12,20,-2.428901,-11,-12,14,1989.5,13,-15,2,4.5,-13,-14],[0.0029478,0.049605,-0.0095481,-0.049089,-0.037432,0.002324,-0.0063714,-0.0017788,0.0066154,-0.0048431,-0.0038807,0.019684,-0.034581,-0.004872,0.0023582]],[[13,1e-35,1,3,39,9.45,2,-3,41,0.3095238,-1,-2,24,-1.372948,4,6,21,0.6555,5,-6,21,0.6105,-4,-5,28,0.27125,7,-15,10,0.06005464,8,12,39,3.366667,-7,9,13,0.4785591,10,11,0,0.3778889,-8,-9,6,17.5,-10,-11,20,-0.9375081,-12,13,19,0.4494949,-13,-14],[-0.028548,0.014928,0.030816,-0.0014355,0.026658,-0.057918,-0.0075179,0.015908,0.0044849,-0.010782,0.014332,0.0001544,0.0062729,-0.019498,0.019273]],[[13,1e-35,1,3,15,-3.247855,2,-3,43,0.9166667,-1,-2,31,0.775,4,7,6,9.5,-4,5,7,1e-35,-5,6,23,9.5,-6,-7,6,2.5,8,9,0,0.181,-8,-9,19,0.6904762,10,12,50,0.5357143,11,-12,10,0.1801163,-10,-11,6,21.5,13,-15,0,0.437,-13,-14],[0.021937,-0.014969,0.039336,0.00017255,-0.00011419,-0.025618,-0.0066649,0.0054996,-0.0087152,0.010379,-0.001483,-0.0012677,0.016247,-0.0024199,0.024914]],[[27,0.8166667,1,6,37,0.3666667,2,4,34,34.5,-1,3,0,0.1663333,-2,-3,38,2.583333,5,-6,12,0.9807172,-4,-5,16,0.3666667,7,10,0,0.949,8,-10,48,0.6333333,9,-9,6,64.5,-7,-8,20,-0.5541913,11,13,21,0.0935,12,-13,4,1155.0,-11,-12,12,0.5525113,-14,-15],[-0.033584,-0.023418,0.010635,-0.0057296,-0.027855,-0.055667,-0.030302,0.035061,0.020191,0.018993,-0.014451,0.0037436,-0.00072786,-0.0083794,0.019334]],[[33,5630.25,1,12,32,0.8066239,2,5,9,1e-35,3,-4,28,0.23775,4,-3,2,18.5,-1,-2,12,1.008184,6,-12,39,8.690476,7,11,11,0.3628258,8,-9,2,13.5,9,10,22,0.9607692,-5,-6,33,3423.25,-7,-8,2,7.5,-10,-11,5,7.5,-13,13,12,0.8166641,-14,-15],[0.0066704,-0.0098379,0.017395,-0.00042414,-0.040339,0.052391,-0.028415,-0.0056423,0.0080901,0.02476,0.00082295,-0.028777,0.0097706,0.0059573,-0.011563]],[[25,-2.971001,-1,1,28,0.079,2,7,25,-1.246699,3,-7,40,0.8452381,4,-6,13,0.3707457,5,-5,37,1.291667,6,-4,38,0.45,-2,-3,13,0.2365123,8,10,5,7.5,9,-10,15,-1.459604,-8,-9,23,8.5,11,-15,34,26.0,12,13,4,2468.5,-11,-12,2,4.5,-13,-14],[0.0091309,0.0074177,-0.013265,-0.025999,0.0045694,0.0056959,-0.0045577,0.0054292,0.020323,-0.0040233,0.046353,-0.018101,-0.031356,-0.0059812,0.0052061]],[[36,7.55,1,4,32,0.6012821,-1,2,21,0.4355,3,-4,4,1489.5,-2,-3,4,2658.589,5,8,32,0.6160256,6,-8,24,-2.144917,7,-7,21,0.0685,-5,-6,0,0.243,9,-15,21,0.2615,10,-14,21,0.1985,11,13,26,0.1503667,12,-11,4,2909.5,-9,-10,21,0.2075,-12,-13],[0.00052314,0.014069,-0.0046528,-0.050472,0.029739,-0.051438,0.035617,-0.043177,-0.048121,0.026522,-0.08774,0.073465,0.021588,-0.047378,0.003228]],[[12,1.146166,1,13,34,57.25,2,4,9,0.6160753,-1,3,40,0.5857143,-2,-3,34,92.625,-4,5,34,165.6667,6,10,12,0.7486747,7,9,8,4.5997,8,-7,32,0.2788889,-5,-6,15,-5.102674,-8,-9,12,0.8385067,-10,11,5,7.5,12,-13,34,887.5,-11,-12,42,2.083333,-14,-15],[0.0065343,-0.0029404,-0.018099,0.0060298,0.0021781,-0.013938,0.0039743,-0.012812,0.0033608,0.0046256,-0.00014484,0.023234,-0.010116,-0.019903,0.0091663]],[[21,0.6715,1,13,21,0.6605,2,11,21,0.6555,3,10,13,0.003650096,4,7,25,-0.9187054,-1,5,3,1.5,6,-4,12,1.000005,-2,-3,36,7.55,-5,8,4,2658.589,-6,9,0,0.243,-7,-8,4,854.5,-9,-10,4,1489.5,12,-13,0,0.083,-11,-12,4,1878.5,-14,-15],[-0.0083295,0.03922,-0.011109,0.0069842,-0.0011839,-0.026815,0.021703,0.0029166,0.026003,-0.057275,0.044814,-0.059823,0.02997,-0.072137,0.011021]],[[21,0.6715,1,13,21,0.6605,2,11,31,0.775,3,4,44,0.3666667,-1,-2,21,0.4305,5,10,32,0.4216374,-3,6,33,3148.167,-4,7,2,20.5,-5,8,19,0.775,-6,9,7,1.5,-7,-8,13,0.5864922,-9,-10,4,1489.5,12,-13,2,3.5,-11,-12,4,1878.5,-14,-15],[-0.00053228,-0.012125,0.0069333,-0.0035483,0.012493,-0.0019533,0.00075446,0.031318,-0.0016078,-0.022198,0.044262,-0.051764,0.028558,-0.071061,0.010547]],[[27,0.8166667,1,-15,4,14196.17,2,-14,20,-1.763523,3,11,34,440.25,4,8,1,340.0,-1,5,29,0.55,6,-5,6,19.5,7,-4,7,10.5,-2,-3,6,9.5,9,10,5,8.5,-6,-7,37,0.45,-8,-9,6,3.5,-10,12,32,0.43534,-11,13,6,17.5,-12,-13],[0.0090987,-0.031033,0.03833,-0.0014186,-0.0031011,0.063633,-0.0097235,0.014169,-0.049401,-0.010642,0.03302,0.011777,-0.036314,-0.033433,0.00035813]],[[12,1.000005,1,12,13,0.006031138,2,4,25,-1.151251,-1,3,3,1.5,-2,-3,37,2.585714,5,10,40,0.6904762,-4,6,12,0.7328118,7,9,5,7.5,8,-7,2,17.5,-5,-6,23,5.5,-8,-9,4,1878.5,-10,11,6,7.5,-11,-12,42,1.9,13,-15,37,1.633333,-13,-14],[-0.0092152,0.034412,0.0052348,0.0011441,-0.034818,-0.014223,0.001308,0.0075468,-0.0057702,-0.023468,0.010516,0.00029201,-0.0024337,-0.019573,0.0027699]],[[18,0.4142857,1,4,50,0.2916667,-1,2,0,0.3826667,3,-4,32,0.2788889,-2,-3,28,0.27125,5,13,33,5630.25,6,10,4,17894.97,7,9,25,-3.134151,-5,8,9,5.229517,-6,-7,14,3625.5,-8,-9,0,0.341,11,12,34,559.25,-10,-11,37,4.291667,-12,-13,24,-1.372948,-14,-15],[-0.070035,-0.054168,0.0089003,0.016017,0.01005,-0.0009257,-0.031179,-0.040207,-0.0071686,-0.035784,0.023474,-0.00025698,0.012119,0.0011312,0.018469]],[[24,-1.372948,1,9,15,-3.11964,-1,2,4,1455.5,-2,3,34,147.625,4,8,0,0.497,5,7,21,0.1385,-3,6,32,0.6963109,-4,-5,32,0.2696154,-6,-7,0,0.3442222,-8,-9,10,0.06005464,10,11,0,0.317,-10,-11,9,3.461606,12,-15,21,0.1255,13,-14,31,0.8444444,-12,-13],[0.00073126,0.0070263,-0.0077185,-0.027529,-0.077651,0.013356,-0.011935,0.0062517,-0.0058248,0.010406,0.0023887,-0.040041,0.0053052,-0.0069535,0.011584]],[[20,-4.527063,-1,1,21,0.6715,2,-15,21,0.6605,3,12,21,0.6555,4,-11,25,-3.134151,-2,5,28,0.079,6,9,11,-0.5345833,7,8,37,3.633333,-3,-4,11,-0.4359922,-5,-6,26,0.230125,10,-10,21,0.1395,11,-9,42,0.4166667,-7,-8,20,-1.289065,-12,13,21,0.6695,-13,-14],[-0.028985,0.0097361,-0.0037763,-0.025185,0.0083592,-0.0013206,0.03886,0.00032123,-0.0080897,0.0048705,-0.03434,-0.055327,0.03183,-0.0064721,-0.028877]],[[18,0.4142857,1,5,0,0.3826667,2,3,26,0.1391667,-1,-2,5,3.5,-3,4,30,1.583333,-4,-5,15,-6.73891,6,8,28,0.2155,7,-8,38,3.366667,-6,-7,16,0.3095238,9,11,6,17.5,-9,10,2,71.5,-10,-11,26,0.6715,12,13,26,0.6595,-12,-13,4,1878.5,-14,-15],[0.029092,-0.051494,0.027374,-0.054197,0.0078761,-0.023521,0.026227,0.014364,0.046946,-0.049285,0.027453,9.6974e-06,0.016188,-0.069723,0.0090294]],[[27,0.8166667,1,-15,37,0.3666667,2,5,35,2.9,3,4,47,0.7083333,-1,-2,38,0.775,-3,-4,38,2.583333,6,-14,22,0.2649123,7,8,24,-2.210432,-5,-6,4,1385.5,-7,9,1,340.0,-8,10,24,-1.600569,-9,11,0,0.651,12,13,0,0.2952222,-10,-11,50,0.9166667,-12,-13],[0.0020303,-0.042521,0.018966,-0.0022467,-0.022116,0.04102,-0.041734,0.010848,-0.023562,-0.028101,0.023536,0.012237,-0.045661,-0.053178,0.00032615]],[[13,0.003650096,1,3,25,-0.9187054,-1,2,10,0.2451415,-2,-3,20,-4.586151,-4,4,16,0.2678571,5,7,24,-0.7607298,-5,6,2,71.5,-6,-7,20,-0.5541913,8,13,25,-1.572726,9,11,4,1670.307,10,-10,37,1.45,-8,-9,19,0.3484848,12,-13,26,0.2001667,-11,-12,13,0.4488046,-14,-15],[-0.0076766,0.019118,-0.0063485,-0.033073,0.019884,-0.049979,0.037782,0.0064777,-0.024536,0.0052412,-0.0063049,0.00045127,0.0015823,0.01615,-0.0081404]],[[34,57.25,1,2,9,0.4437617,-1,-2,34,92.625,-3,3,21,0.5205,4,-15,21,0.5105,5,-14,21,0.4555,6,-13,35,2.633333,7,8,21,0.3265,-4,-5,34,172.875,9,10,21,0.4355,-6,-7,2,4.5,11,12,20,-3.01067,-8,-9,5,7.5,-10,13,2,13.5,-11,-12],[0.0079409,-0.0064882,0.0054729,0.014236,-0.047666,-0.003113,-0.053092,-0.030311,0.031014,0.0035021,-0.01614,-0.00052056,-0.037938,0.022845,-0.017473]],[[18,0.4142857,1,7,36,8.45,2,-7,4,17894.97,3,-6,37,0.2916667,4,6,30,3.1,-1,5,8,4.70221,-2,-3,8,5.496262,-4,-5,15,-6.855403,8,9,28,0.2155,-8,-9,25,-2.971001,-10,10,9,5.337803,11,-15,28,0.29125,-11,12,9,0.4437617,-12,13,10,0.5503165,-13,-14],[-0.079701,-0.042558,0.035913,0.018812,-0.0066618,0.039739,-0.046118,-0.01966,0.011638,0.0082425,-0.00047509,0.013873,-0.0035157,0.029268,-0.031167]],[[13,0.003650096,1,5,25,-0.9187054,2,4,33,1304.167,3,-3,34,77.75,-1,-2,10,0.2451415,-4,-5,20,-4.586151,-6,6,36,7.55,-7,7,4,2658.589,8,9,32,0.6160256,-8,-9,0,0.243,10,-15,26,0.2621667,11,-14,26,0.198125,12,13,26,0.1503667,-10,-11,26,0.2062,-12,-13],[-9.9722e-05,-0.048314,0.00027559,0.017858,-0.0060081,-0.032368,-0.00093602,-0.00092729,-0.040779,0.015858,-0.082296,0.068352,0.019402,-0.063532,0.0026156]],[[13,1e-35,1,2,15,-3.063867,-1,-2,11,-1.285069,3,8,22,0.6099034,-3,4,50,0.5857143,-4,5,4,1414.225,6,7,4,1296.5,-5,-6,18,0.5857143,-7,-8,18,0.4142857,9,10,36,8.1,-9,-10,12,1.117603,11,12,36,7.55,-11,-12,42,2.267857,13,-15,22,0.3956522,-13,-14],[0.0050363,0.039066,-0.018507,0.010044,-0.02984,0.041099,0.0033832,-0.026517,0.013036,-0.035439,-0.0006116,0.0026193,0.006286,-0.022776,0.0087222]],[[13,0.003650096,1,4,25,-0.9187054,-1,2,10,0.2451415,3,-4,12,1.000005,-2,-3,20,-4.586151,-5,5,37,2.585714,6,9,40,0.775,-6,7,50,0.2916667,8,-9,36,4.45,-7,-8,40,0.5857143,10,13,12,0.7852173,-10,11,18,0.5357143,-11,12,30,12.1,-12,-13,30,1.708333,-14,-15],[-0.0071416,0.023249,0.0014553,-0.0061422,-0.031791,0.00086075,-0.0069914,-0.036145,-0.0013589,0.0051195,-0.0044663,-0.036003,0.022726,0.010986,0.00095189]],[[34,57.25,1,3,33,965.25,-1,2,26,0.03016667,-2,-3,34,92.625,-4,4,26,0.5195,5,13,26,0.5095,6,-13,26,0.4555,7,12,35,2.633333,8,9,26,0.3241,-5,-6,34,172.875,10,-10,12,0.7525749,11,-9,33,1282.125,-7,-8,2,8.5,-11,-12,8,2.915692,-14,-15],[-0.0012542,0.014106,-0.024666,0.005041,0.015314,-0.015936,0.0026006,-0.012506,0.00056937,0.0015072,-0.067925,-0.0018111,0.023488,-0.0015241,-0.030217]],[[21,0.6715,1,13,21,0.6605,2,11,21,0.6555,3,10,31,0.8444444,4,5,6,16.5,-1,-2,21,0.4305,6,-8,32,0.4216374,7,8,6,3.5,-3,-4,33,3148.167,-5,9,2,20.5,-6,-7,4,854.5,-9,-10,4,1489.5,12,-13,0,0.083,-11,-12,4,1878.5,-14,-15],[-0.00024019,-0.018548,-0.0015502,0.0094171,-0.0031958,0.011964,0.0004757,-0.0071571,0.0263,-0.053768,0.04359,-0.054427,0.024227,-0.068459,0.0094394]],[[12,1.146166,1,13,15,-1.204846,2,8,36,1e-35,3,4,21,0.2435,-1,-2,21,0.1385,-3,5,26,0.1525833,6,-7,32,0.6963109,-4,7,4,1455.5,-5,-6,12,0.6525035,9,-13,34,419.0,10,-12,4,7642.5,11,12,0,0.801,-8,-9,6,12.5,-10,-11,39,4.55,-14,-15],[0.034641,-0.0097333,0.0010857,-0.0077226,0.027258,-0.05869,-0.00059159,0.005766,-0.032377,-0.079949,-0.0069186,0.016415,0.014675,-0.028255,-0.0020987]],[[21,0.6715,1,13,24,-1.372948,2,10,24,-1.394339,3,7,19,0.4365079,4,-5,30,4.55,-1,5,2,25.5,6,-4,50,0.7321429,-2,-3,4,2046.335,-6,8,26,0.245125,-7,9,0,0.851,-8,-9,0,0.109,-10,11,28,0.2536667,12,-13,21,0.4295,-11,-12,4,1878.5,-14,-15],[-0.0010077,-0.01332,-0.056783,-0.003914,0.0039168,0.01145,-0.0040262,-0.06079,0.010094,0.019191,0.0019103,-0.0056513,0.014503,-0.067277,0.0084091]],[[27,0.8166667,1,-15,4,14196.17,2,12,0,0.193,-1,3,0,0.509,4,10,22,0.1026316,-2,5,29,0.7083333,6,-8,35,6.633333,7,9,2,9.5,8,-5,4,1296.5,-3,-4,4,4506.0,-6,-7,32,0.8804762,11,-11,12,0.853766,-9,-10,0,0.831,13,-14,23,9.5,-12,-13],[-0.021314,-0.028167,-0.018787,0.054165,-0.01728,-0.0085259,0.036661,0.031733,0.0018436,-0.016447,-0.064439,-0.046606,0.02429,-0.052289,0.00032123]],[[13,0.003650096,1,6,37,1.916667,2,3,42,1.225,-1,-2,4,1868.035,-3,4,16,0.775,-4,5,20,-1.606689,-5,-6,42,4.9,7,9,12,1.131527,8,-9,28,0.1808333,-7,-8,37,2.291667,10,12,4,13300.32,11,-12,11,0.6446022,-10,-11,4,4610.5,-13,13,34,287.9167,-14,-15],[0.025572,-0.001881,-0.043325,-0.019705,-0.004112,0.024726,-0.0011497,0.0031161,-0.013172,-0.0073709,0.013367,0.0099638,0.021613,-0.010158,0.011823]],[[13,0.003650096,1,4,25,-1.08536,2,3,37,1.45,-1,-2,3,1.5,-3,-4,16,0.2678571,5,9,7,1.5,-5,6,35,1.944444,-6,7,0,0.9884444,8,-9,7,11.5,-7,-8,24,-0.5541913,10,13,25,-2.971001,-10,11,9,5.337803,12,-13,18,0.4142857,-11,-12,13,0.4488046,-14,-15],[0.0056637,-0.020474,0.023213,0.0041608,0.050535,0.042075,-0.059161,0.014402,0.006498,0.0077208,0.0082882,-0.00063932,-0.031029,0.015823,-0.0079144]],[[13,0.003650096,1,4,25,-0.7796769,2,-4,37,1.633333,-1,3,39,9.45,-2,-3,20,-4.60396,-5,5,42,4.9,6,10,12,1.131527,7,-10,28,0.1808333,8,9,25,-1.411798,-6,-7,24,-1.359679,-8,-9,37,2.291667,11,12,4,13058.63,-11,-12,4,4610.5,-13,13,35,7.633333,-14,-15],[0.0058704,-0.032285,-0.00017597,0.012184,-0.03203,0.001746,-0.0026379,-4.7404e-05,0.011688,-0.012342,-0.0039438,0.0093294,0.020901,-0.0088119,0.011303]],[[34,67.16667,1,8,9,0.8735315,2,-8,33,742.25,3,5,24,-1.666449,-1,4,12,0.3019234,-2,-3,12,0.8237467,6,7,6,1.5,-4,-5,14,1278.5,-6,-7,32,0.2236111,-9,9,40,0.4142857,10,-15,13,0.4104073,11,-14,37,1.366667,12,13,38,2.708333,-10,-11,12,0.8091519,-12,-13],[-0.001865,-0.0011128,0.030666,-0.028297,0.00081853,0.02549,-0.0048496,-0.0060764,0.014079,0.0071106,-0.01317,-0.0064104,-0.028971,0.0045648,0.0013505]],[[13,1e-35,1,3,33,1502.25,2,-3,43,1.225,-1,-2,31,0.8444444,4,10,6,9.5,-4,5,2,24.5,6,8,7,1e-35,7,-7,30,4.366667,-5,-6,6,21.5,9,-10,13,0.2004361,-8,-9,6,2.5,11,12,0,0.181,-11,-12,10,0.2050641,-13,13,3,1.5,-14,-15],[0.0078423,-0.037832,0.024833,0.00039174,0.0077648,-0.057093,-0.028631,-0.010346,0.01356,-0.020186,0.004753,-0.0088347,0.0042006,0.0084197,-0.0055811]],[[18,0.4142857,1,4,13,0.1827196,2,3,0,0.951,-1,-2,20,-2.428901,-3,-4,33,5410.25,5,8,32,0.8066239,6,7,4,10464.55,-5,-6,4,2410.5,-7,-8,19,0.8660714,9,-15,6,21.5,10,-14,37,4.291667,11,-13,24,-3.42841,-9,12,4,6201.5,-10,13,0,0.3442222,-11,-12],[-0.00031967,0.047193,-0.043926,0.031609,0.00056962,-0.0066209,-0.032939,-0.0038133,0.037075,-0.035687,0.018256,-0.0016013,0.016176,-0.0066555,0.016492]],[[26,0.6715,1,13,24,-0.5541913,2,8,25,-2.971001,-1,3,13,0.7122632,4,6,34,24.5,-2,5,34,42.08333,-3,-4,5,8.5,-5,7,4,12080.01,-6,-7,4,10464.55,9,12,25,-1.562784,-8,10,26,0.6125,-9,11,26,0.6145,-10,-11,22,0.8297101,-12,-13,4,1878.5,-14,-15],[0.0074027,0.024052,-0.0081516,0.00035077,-0.012642,0.01107,-0.011513,0.0007705,0.026607,-0.051873,0.025441,-0.045988,0.011383,-0.06622,0.008027]],[[16,0.3666667,1,4,7,2.5,-1,2,0,0.8221111,3,-4,48,0.6333333,-2,-3,31,0.8444444,5,7,6,16.5,-5,6,19,0.775,-6,-7,6,3.5,8,10,0,0.403,-8,9,19,0.6458333,-9,-10,19,0.5227273,-11,11,10,0.1900413,12,13,6,19.5,-12,-13,18,0.4642857,-14,-15],[0.028461,-0.037381,0.02585,0.0020433,-0.00017197,-0.022099,0.019819,-0.00045863,-0.0037393,-0.033548,0.0011979,0.0074043,0.022704,0.027045,-0.0070846]],[[21,1e-35,1,-15,37,0.3666667,2,6,34,34.5,3,4,23,2.5,-1,-2,0,0.1663333,5,-5,15,-3.247855,-3,-4,5,7.5,7,13,32,0.6090353,8,11,4,1280.5,-6,9,37,4.416667,10,-9,5,2.5,-7,-8,23,8.5,-10,12,22,0.9069264,-11,-12,5,9.5,-13,-14],[-0.066723,0.012287,-0.037313,0.027415,0.010079,-0.035014,0.017766,-0.0067813,0.046627,-0.041729,0.01054,-0.038484,-0.062205,-0.011612,0.0002934]],[[16,0.3666667,1,7,19,0.1277174,-1,2,6,64.5,3,-7,5,3.5,-2,4,50,0.4142857,-3,5,3,3.5,6,-6,6,34.5,-4,-5,24,-0.5541913,8,13,19,0.4365079,9,11,6,5.5,-8,10,24,-1.021804,-9,-10,6,3.5,-11,12,10,0.2050641,-12,-13,13,0.4488046,-14,-15],[0.03769,-0.045918,0.026657,-0.03501,0.028841,-0.051789,0.021044,0.00099576,-0.0064257,0.0098958,-0.0055687,0.0068367,-0.0022129,0.017507,-0.006464]],[[13,1e-35,1,3,15,-3.063867,2,-3,33,1373.167,-1,-2,11,-1.285069,4,11,49,1e-35,5,-11,14,1167.5,-4,6,36,4.633333,7,9,21,0.1435,-5,8,50,0.6333333,-6,-7,14,2993.5,10,-10,21,0.2535,-8,-9,13,0.006031138,12,13,32,0.2944947,-12,-13,36,7.55,-14,-15],[-0.012599,0.015933,0.038598,-0.029478,0.0065645,0.0039241,-0.025345,-0.041676,-0.0025441,-0.0057774,0.015523,0.025819,0.0035273,-0.00076578,0.0021268]],[[18,0.4142857,1,4,12,0.7486747,-1,2,36,8.45,3,-4,0,0.951,-2,-3,15,-6.73891,5,9,25,-0.04264543,6,-9,38,3.366667,7,-8,18,0.8541667,-5,8,25,-1.685792,-6,-7,25,-2.971001,-10,10,9,5.337803,11,-15,9,0.9256935,12,-14,50,0.5857143,-11,13,39,7.55,-12,-13],[0.02952,0.0033706,0.045164,-0.055947,-0.025628,-0.017143,0.027364,0.028998,0.018502,0.0076466,0.0069611,-0.01034,0.0014794,-0.0009794,-0.029239]],[[18,0.4142857,1,6,13,0.249118,2,4,36,8.45,3,-3,26,0.2851667,-1,-2,44,0.6333333,5,-6,24,-1.582749,-4,-5,37,8.833333,7,13,21,0.0375,8,12,21,0.0325,-7,9,6,10.5,10,11,24,-1.27606,-8,-9,31,0.8444444,-10,-11,24,-3.3598,-12,-13,21,0.1565,-14,-15],[0.0067078,-0.053008,-0.047176,-0.029017,0.036593,0.043049,-0.00063042,-0.038121,0.019084,-0.034061,0.008327,0.019044,2.7374e-05,0.025598,-0.027159]],[[18,0.4142857,1,9,4,17894.97,2,8,15,-4.741945,3,7,4,16347.0,4,-5,5,1.5,-1,5,9,1.895263,-2,6,4,4033.5,-3,-4,5,6.5,-6,-7,5,10.5,-8,-9,15,-6.73891,10,12,28,0.2155,11,-12,38,3.366667,-10,-11,16,0.3095238,13,-15,6,17.5,-13,-14],[0.029569,-0.0078508,-0.037494,0.02891,-0.061962,0.037214,-0.01599,0.044796,-0.030626,-0.020887,0.023184,0.014004,0.045808,-0.035432,5.0845e-05]],[[21,0.6715,1,13,21,0.6605,2,8,21,0.6555,3,7,27,0.8166667,4,-5,37,0.3666667,5,6,34,34.5,-1,-2,14,9183.0,-3,-4,4,854.5,-6,-7,4,1296.5,-8,9,16,0.9,-9,10,21,0.6685,-10,11,4,1823.5,12,-13,4,1315.5,-11,-12,4,1878.5,-14,-15],[-0.029888,0.0062438,-0.0078023,-0.043951,0.00028363,0.025749,-0.051114,-0.056901,-0.026719,0.035215,0.051422,-0.057482,0.028369,-0.064895,0.0082434]],[[18,0.4142857,1,-15,12,0.7486747,-1,2,0,0.951,3,-14,21,0.0195,4,6,35,4.55,-2,5,26,0.2125357,-3,-4,21,0.0255,-5,7,26,0.1161667,-6,8,0,0.3826667,-7,9,2,19.5,-8,10,0,0.8942222,11,13,0,0.751,-9,12,24,-1.561013,-10,-11,24,-1.404756,-12,-13],[0.027106,0.018167,-0.05788,0.027656,0.055117,0.036324,-0.040522,0.037016,-0.013878,0.035671,-0.015879,-0.077232,0.017019,0.042884,-0.00016088]],[[18,0.4142857,1,-15,4,17894.97,2,13,24,-1.404756,3,12,19,0.5916667,4,11,9,1.895263,5,-8,36,5.55,6,10,9,0.6160753,-1,7,35,7.291667,8,-5,33,2456.5,-2,9,26,0.2125357,-3,-4,19,0.4833333,-6,-7,5,6.5,-9,-10,44,0.2916667,-11,-12,0,0.729,-13,-14],[0.034567,-0.019058,0.038978,-0.032989,-0.064767,-0.068086,-0.0031348,0.017137,0.029018,-0.0086298,-0.01291,0.047294,-0.027788,0.044784,-0.0001777]],[[18,0.4142857,1,13,0,0.7268889,2,8,5,1.5,-1,3,0,0.6605556,4,7,43,4.633333,5,-5,45,0.6333333,-2,6,36,6.291667,-3,-4,26,0.2371667,-6,-7,50,0.9166667,9,11,26,0.1301667,10,-10,5,4.5,-8,-9,6,39.5,12,-13,30,3.55,-11,-12,15,-7.170322,-14,-15],[0.029778,-0.027005,0.017936,-0.03596,0.026556,-0.072052,0.024133,0.02278,-0.057172,0.033715,0.014332,-0.054172,0.034897,-0.013323,-7.3563e-05]],[[18,0.4142857,1,10,0,0.7268889,2,8,21,0.0975,3,-7,0,0.6605556,4,7,4,14999.83,5,6,36,2.9,-1,-2,37,3.309524,-3,-4,41,0.6333333,-5,-6,21,0.0835,9,-10,4,17894.97,-8,-9,33,5630.25,-11,11,5,7.5,-12,12,4,6933.19,13,-15,21,0.0595,-13,-14],[-0.023704,0.024167,-0.063016,0.021109,-0.057459,0.022544,-0.026272,-0.0017499,0.036584,0.039067,-0.00059776,0.0080501,-0.0066502,-0.059546,0.00030828]],[[18,0.4142857,1,12,6,27.5,2,7,26,0.1231667,-1,3,37,0.2916667,-2,4,20,-2.052514,5,6,36,5.9,-3,-4,2,28.5,-5,-6,13,0.1323302,8,-12,35,6.125,-7,9,19,0.4833333,10,11,29,0.775,-8,-9,20,-1.893161,-10,-11,24,-1.21694,-13,13,8,3.133687,-14,-15],[0.026134,-0.051399,-0.03689,0.024086,0.022665,-0.037883,0.027485,0.01421,-0.071719,0.031014,-0.046428,0.035384,-0.00088526,0.0046181,-0.0034621]],[[18,0.4142857,1,13,50,0.2916667,-1,2,6,27.5,3,10,26,0.14225,-2,4,7,5.5,5,7,22,0.787594,-3,6,19,0.775,-4,-5,2,21.5,8,9,6,19.5,-6,-7,37,2.291667,-8,-9,45,0.225,11,12,22,0.9354167,-10,-11,36,6.928571,-12,-13,25,-2.971001,-14,-15],[-0.054396,0.022568,-0.020542,0.030188,-0.021899,-0.040672,0.024112,-0.086636,0.0054777,-0.028097,0.033324,0.036308,-0.0026962,0.0068443,-0.00038887]],[[18,0.4142857,-1,1,33,5630.25,2,8,32,0.6802778,-2,3,21,0.2495,4,7,21,0.1385,5,6,37,7.833333,-3,-4,13,0.3749697,-5,-6,39,6.633333,-7,-8,19,0.8660714,9,-15,5,8.5,10,12,2,21.5,-9,11,32,0.9417421,-10,-11,12,0.6435245,13,-14,38,9.75,-12,-13],[0.010431,0.00022679,-0.0038746,0.031023,-0.024461,0.0014503,-0.0072203,0.0079198,0.013412,0.0060242,-0.013434,-0.0058681,0.025549,-0.012314,0.016323]],[[18,0.4142857,1,-15,0,0.7268889,2,10,8,6.263029,3,-9,38,3.583333,4,-8,0,0.6605556,5,9,36,6.291667,6,8,0,0.3826667,7,-3,26,0.1391667,-1,-2,50,0.9166667,-4,-5,41,0.6333333,-6,-7,4,21707.5,11,-14,50,0.9166667,-10,12,26,0.2211667,13,-13,19,0.6458333,-11,-12],[0.02562,-0.030421,0.029833,-0.052358,0.027238,-0.052902,0.012578,-0.040055,-0.032683,0.020527,-0.01039,0.050437,-0.061328,0.046407,-0.000177]],[[18,0.4142857,-1,1,16,0.3666667,2,9,0,0.949,3,-9,48,0.6333333,4,-8,6,64.5,5,-7,21,0.3575,-2,6,7,2.5,-3,7,6,32.5,-4,8,22,0.4907407,-5,-6,20,-0.5541913,10,13,15,-7.170322,-10,11,13,1e-35,12,-13,15,-3.063867,-11,-12,12,0.5525113,-14,-15],[0.0094444,-0.037966,0.034097,-0.038596,-0.045427,0.027699,0.034598,0.026078,0.016427,-0.015661,0.0050696,0.037605,-0.00024714,-0.0063723,0.016901]],[[18,0.4142857,1,3,8,5.451565,-1,2,11,-0.1111715,-2,-3,25,-2.971001,-4,4,27,0.7083333,5,-15,4,18618.0,6,-14,0,0.193,-5,7,0,0.509,8,10,34,34.5,-6,9,26,0.02125,-7,-8,32,0.8804762,11,-13,5,9.5,12,13,23,6.5,-9,-10,37,0.45,-11,-12],[0.014364,-0.01443,0.017156,0.0066006,-0.020519,-0.044053,0.016962,-0.0064944,-0.017123,0.0071645,0.041664,-0.0086674,-0.065177,-0.046014,-7.1422e-05]],[[33,3238.583,1,8,38,5.875,2,5,12,0.7328118,-1,3,39,3.225,4,-4,34,140.125,-2,-3,12,0.50241,6,7,0,0.8663333,-5,-6,0,0.135,-7,-8,5,7.5,9,10,26,0.3631667,-9,-10,12,0.6435245,11,13,38,9.75,-11,12,19,0.09307359,-12,-13,14,6549.5,-14,-15],[-0.0032956,5.7464e-05,-0.025521,0.0042046,0.028509,-0.028443,-0.058716,0.00016337,0.0054813,-0.019701,0.0015645,0.038603,0.0032245,-0.015812,-0.0018508]],[[33,3238.583,1,10,35,8.45,2,9,12,0.7328118,3,5,40,0.8166667,4,-3,5,6.5,-1,-2,39,3.225,6,-8,37,1.225,7,8,20,-2.873178,-4,-5,35,5.816667,-6,-7,2,7.5,-9,-10,5,7.5,11,12,20,-3.46437,-11,-12,12,0.6435245,-13,13,14,6549.5,-14,-15],[-0.003842,0.0073577,-0.0082829,-0.025675,0.010731,-0.041869,-0.012607,0.0044346,-0.048393,-0.0046552,0.026336,0.0039368,0.0063357,-0.014815,-0.0018155]],[[34,67.16667,1,6,4,1795.597,2,4,20,-1.988885,3,-3,26,0.2681667,-1,-2,2,15.5,5,-6,4,3720.5,-4,-5,4,1030.977,7,8,26,0.29325,-7,-8,34,92.625,-9,9,4,1296.5,10,11,34,96.33333,-10,-11,34,97.75,12,-15,33,2108.167,13,-14,4,2862.068,-12,-13],[-7.7399e-05,-0.042484,0.010164,-0.029502,-0.00022238,0.00051778,-0.012748,-0.058514,0.0075536,0.038352,-0.030718,0.0070325,-0.019775,-0.046077,0.00071482]],[[13,0.003650096,1,10,37,1.916667,2,7,33,882.25,-1,3,26,0.09416667,4,5,43,2.416667,-2,-3,33,1907.25,-4,6,19,0.3693182,-5,-6,4,1868.035,-7,8,12,1.000005,9,-10,8,1.620342,-8,-9,25,-1.572726,11,-15,24,-0.9398138,12,-14,4,1576.247,13,-13,37,1.45,-11,-12],[-0.013044,0.034468,-0.024169,0.018676,-0.039233,0.013913,-0.039692,0.033254,0.00030456,-0.016131,0.0047656,-0.022193,0.0061346,-0.0084715,-0.00091523]],[[13,0.003650096,1,6,49,0.2916667,2,-6,15,-1.920652,3,-5,36,4.1,-1,4,5,6.5,5,-4,25,-0.04264543,-2,-3,25,-1.572726,7,12,4,1766.005,8,-12,34,147.625,9,11,26,0.5115,10,-9,32,0.6524758,-7,-8,23,6.5,-10,-11,24,-1.090849,-13,13,13,0.5313737,-14,-15],[0.0075569,0.0051941,-0.040182,-0.024861,0.028453,0.02533,0.001981,0.030599,-0.028292,-0.041578,0.010946,0.0044528,-0.0020066,0.0064692,-0.0057253]],[[13,0.003650096,1,6,37,1.916667,2,4,42,1.225,3,-3,15,-6.73891,-1,-2,15,-2.03111,5,-6,18,0.7638889,-4,-5,37,2.585714,7,9,19,0.3798077,8,-9,25,-1.499709,-7,-8,40,0.5857143,10,13,12,0.7852173,11,12,36,4.916667,-10,-11,48,0.2916667,-12,-13,16,0.7083333,-14,-15],[-0.036694,0.024796,-0.00099499,0.0022657,-0.024161,0.026727,0.0022619,-0.0046517,0.0015185,-0.0049777,0.011445,-0.026062,0.020091,-0.0059884,0.0080427]],[[34,67.16667,-1,1,36,2.9,2,4,0,0.143,3,-4,20,-2.611907,-2,-3,13,0.729515,5,13,5,7.5,6,12,13,0.5313737,7,8,34,887.5,-5,-6,37,4.416667,9,-11,39,5.55,10,11,37,1.633333,-7,-8,5,4.5,-9,-10,13,0.4104073,-12,-13,5,6.5,-14,-15],[-0.0026878,-0.034028,0.011879,0.010256,0.0017868,0.014052,-0.015757,0.014377,-0.036563,-0.010685,0.016755,-0.0057267,0.0056835,-0.020162,-0.001555]],[[28,0.08366667,1,4,3,1.5,-1,2,10,0.195061,-2,3,19,0.1558704,-3,-4,19,0.5505051,5,9,5,5.5,6,8,9,1.063709,7,-7,11,0.8634694,-5,-6,10,0.760102,-8,-9,6,10.5,10,11,2,18.5,-10,-11,19,0.8660714,12,13,18,0.9444444,-12,-13,6,26.5,-14,-15],[0.00011328,0.0031265,0.0029375,-0.013426,0.0080421,-0.034703,-0.0028585,-0.0043265,0.013294,0.0072606,-0.022774,0.0099753,-0.017873,0.011863,0.036519]],[[13,0.003650096,1,10,37,1.916667,2,7,33,718.25,-1,3,41,0.9,4,-6,33,2178.167,5,6,26,0.29525,-2,-3,19,0.4365079,-4,-5,43,4.916667,8,-10,18,0.5857143,-7,9,33,1882.167,-8,-9,37,2.585714,-11,11,4,1878.5,12,13,26,0.1371,-12,-13,16,0.7083333,-14,-15],[-0.021182,0.022302,-0.0094152,-0.016595,0.010915,0.033539,0.00020261,-0.050077,-0.0092623,0.011965,-0.00093578,-0.0040693,-0.034853,-0.0083227,0.0057047]],[[13,0.003650096,1,8,37,1.916667,2,6,33,718.25,-1,3,41,0.9,4,-5,33,2178.167,5,-4,26,0.29525,-2,-3,15,-2.465487,7,-8,18,0.7638889,-6,-7,33,7546.5,9,11,16,0.3666667,10,-11,48,0.6333333,-9,-10,50,0.6333333,-12,12,12,0.5264323,-13,13,22,0.902381,-14,-15],[-0.020228,0.021275,-0.0085898,-0.0020576,0.03303,0.0015354,-0.02831,0.020216,-0.016933,0.026096,-0.00031069,-0.017829,0.026233,-0.007372,0.012818]],[[13,0.003650096,1,10,36,8.733333,2,-10,33,1304.167,3,5,39,3.875,-1,4,26,0.075125,-2,-3,39,1.291667,-4,6,2,10.5,7,9,42,1.45,8,-7,26,0.01116667,-5,-6,19,0.3798077,-8,-9,33,7546.5,-11,11,50,0.6333333,-12,12,12,0.5909979,-13,13,5,8.5,-14,-15],[-0.035588,-0.029906,0.012922,0.034529,-0.029691,0.033107,-0.00021507,-0.013177,0.010129,-0.018917,-0.00045502,-0.017444,0.021538,0.013379,-0.0078145]],[[19,0.3484848,1,13,6,5.5,2,7,37,1.291667,3,6,4,1877.898,-1,4,21,0.0935,-2,5,5,5.5,-3,-4,4,1555.5,-5,-6,20,-1.105664,8,-13,2,19.5,9,10,23,8.5,-7,-8,6,17.5,11,-12,21,0.2075,12,-11,8,3.300399,-9,-10,6,3.5,-14,-15],[0.0049129,0.0026449,-0.037336,-0.008469,-0.024054,0.0075327,-0.021325,-0.00037733,-0.021319,0.0012701,0.015279,-0.012034,0.0080124,-0.0055627,0.0031773]],[[13,0.003650096,1,8,37,1.916667,2,5,42,1.225,3,4,15,-6.73891,-1,-2,19,0.4494949,-3,-4,15,-2.03111,6,-8,18,0.7638889,-5,7,33,1866.25,-6,-7,20,-4.60396,-9,9,33,7546.5,-10,10,13,0.457311,11,-15,34,930.0,12,13,42,5.527778,-11,-12,7,3.5,-13,-14],[-0.033125,0.02263,-0.01092,0.010479,0.00086735,-0.045094,-0.0082573,0.025439,-0.030631,-0.00040136,-0.0072272,0.013152,0.027759,-0.0056772,0.020953]],[[13,0.003650096,1,5,10,0.2451415,2,-5,11,-0.4988081,3,-4,41,0.3095238,4,-3,15,-1.920652,-1,-2,20,-4.60396,-6,6,11,-0.5345833,-7,7,13,0.04370614,8,9,21,0.0805,-8,-9,34,175.1667,10,13,4,7642.5,-10,11,6,18.5,12,-13,5,8.5,-11,-12,4,2526.5,-14,-15],[-0.002975,0.024399,0.015332,0.026393,-0.0062746,-0.030054,-0.0030867,-0.0058967,0.014673,-0.00043016,-0.036313,-0.0090034,-0.002433,-0.036212,0.0030656]],[[13,0.003650096,1,7,37,1.916667,2,4,42,1.225,3,-3,15,-6.73891,-1,-2,15,-2.465487,5,6,18,0.7638889,-4,-5,24,-1.611025,-6,-7,20,-2.428901,8,9,10,0.3450352,-8,-9,28,0.28125,10,-15,16,0.7083333,11,-14,10,0.1253272,12,13,37,1.916667,-10,-11,25,-0.07486105,-12,-13],[-0.029845,0.02144,-0.00078359,0.00029828,-0.024061,-0.032723,0.025937,-0.0060959,0.0023932,0.0095715,-0.0063917,-0.012851,0.016063,0.00074537,0.0082587]],[[34,67.16667,1,9,4,1296.5,2,4,20,-2.771769,3,-3,32,1e-35,-1,-2,2,15.5,5,8,21,0.1285,6,7,4,2115.824,-4,-5,2,7.5,-6,-7,4,7859.55,-8,-9,4,1030.977,10,12,34,137.1,11,-12,32,0.2696154,-10,-11,32,0.2236111,13,-15,21,0.2535,-13,-14],[0.010588,-0.020386,0.010178,0.010592,-0.021411,-0.035565,-0.014152,0.0069339,-0.02595,-0.005762,-0.043589,0.014008,0.01799,-0.015098,0.00037123]],[[21,0.6715,1,13,21,0.6605,2,8,21,0.6555,3,7,19,0.3484848,-1,4,21,0.4305,5,6,10,0.2050641,-2,-3,39,3.225,-4,-5,4,854.5,-6,-7,4,1296.5,-8,9,3,1.5,10,-13,21,0.6685,-9,11,4,1823.5,12,-12,4,1315.5,-10,-11,4,1878.5,-14,-15],[-0.00093192,0.0045078,-0.0023355,-0.028355,-0.0028135,0.025388,-0.048122,-0.050032,0.034647,0.051868,-0.053362,0.025064,-0.023249,-0.062473,0.0056584]],[[18,0.4142857,1,13,21,0.1565,2,-13,0,0.7268889,3,6,2,28.5,4,5,28,0.2255,-1,-2,5,3.5,-3,-4,21,0.0835,7,-12,22,0.7752525,8,9,36,3.1,-5,-6,19,0.5669643,10,-11,36,6.928571,11,-10,34,293.125,12,-9,0,0.8615556,-7,-8,24,-0.5541913,-14,-15],[0.0085923,-0.031326,0.014687,-0.070687,0.01593,-0.060841,0.018244,-0.044754,0.033375,-0.041766,0.03143,0.039606,-0.046846,-0.00031254,0.007516]],[[18,0.4142857,1,11,50,0.2916667,-1,2,0,0.7268889,3,-11,21,0.0835,4,8,4,14999.83,5,7,0,0.651,-2,6,13,0.2526651,-3,-4,5,6.5,-5,-6,5,2.5,9,-10,21,0.0885,-7,10,21,0.1485,-8,-9,33,9008.0,12,13,49,1e-35,-12,-13,49,1e-35,-14,-15],[-0.053606,0.022941,-0.054513,0.020903,0.028962,-0.069196,-0.057664,0.02066,-0.036346,-0.055018,0.017673,-0.00066707,0.0037279,0.013802,-0.020167]],[[33,9008.0,1,13,12,1.117603,2,10,16,0.55,3,9,19,0.1277174,-1,4,24,-1.459038,-2,5,6,36.5,6,-7,4,1878.5,-3,7,2,17.5,8,-6,4,4812.67,-4,-5,19,0.4365079,-8,-9,42,2.380952,11,-13,32,0.3920807,-10,12,6,5.5,-11,-12,49,1e-35,-14,-15],[0.012848,-0.03602,0.014269,-0.037881,-0.0035197,-0.0064135,0.0055842,-0.0008835,0.0027464,0.0059015,-0.032407,-0.0078994,0.007255,0.013158,-0.017392]],[[18,0.4142857,-1,1,24,-1.21694,2,11,30,10.1,3,-11,15,-3.092482,4,5,30,8.416667,-2,-3,4,1369.5,6,7,37,1.916667,-4,-5,35,1.944444,-6,8,37,2.928571,-7,9,21,0.2005,-8,10,30,1.708333,-9,-10,10,0.1401754,12,-15,18,0.7888889,13,-14,11,1e-35,-12,-13],[0.0084501,0.00061609,0.018747,0.010051,-0.033684,-0.023077,-0.0067327,-0.0049624,0.013708,-0.0083997,-0.01542,0.021318,-0.00479,0.0017766,-0.0049895]],[[13,0.003650096,1,5,33,1186.25,2,3,39,4.125,-1,-2,36,8.733333,4,-5,39,1.291667,-3,-4,16,0.2678571,6,9,6,17.5,-6,7,6,65.5,-7,8,13,0.4620487,-8,-9,20,-0.5541913,10,12,25,-2.901253,-10,11,9,5.337803,-11,-12,13,0.4488046,13,-15,21,0.6695,-13,-14],[-0.028594,0.0059508,0.029116,0.0071632,-0.01862,0.041051,-0.046355,0.028601,-0.041733,0.0062516,-0.00043717,-0.029168,0.0159,-0.042716,-0.006977]],[[18,0.4142857,-1,1,24,-1.372948,2,6,25,-1.514548,-2,3,9,4.082881,4,-6,24,-3.3598,5,-5,5,9.5,-3,-4,10,0.1852835,7,12,18,0.7888889,8,-12,13,0.2266805,9,-11,24,-1.053765,10,-10,50,0.5357143,-7,11,19,0.5916667,-8,-9,9,2.890714,13,-15,25,-0.07486105,-13,-14],[0.0080069,0.0028542,0.0029332,0.030671,-0.00258,-0.020237,0.020701,-0.013149,0.017924,0.030558,-0.0049547,0.0013497,-0.01088,0.017278,0.004329]],[[28,0.1808333,1,9,42,4.9,2,-9,15,-6.855403,-1,3,25,-1.572726,4,-8,21,0.4305,5,7,12,0.8309799,-2,6,36,8.9,-3,-4,4,1766.005,-5,8,4,1951.0,-6,-7,12,0.7688689,10,12,6,2.5,11,-12,4,1670.307,-10,-11,32,0.5566239,-13,13,26,0.2721667,-14,-15],[-0.017395,0.0055871,0.00073459,-0.017309,-0.021372,0.02878,-0.0045606,-0.0018792,0.0038415,0.0049954,-0.017481,0.0016326,0.011063,-0.0030803,0.01625]],[[33,9008.0,1,13,28,0.1808333,2,3,15,-6.855403,-1,-2,31,0.8444444,4,9,26,0.2721667,5,8,24,-1.636499,6,-6,8,5.329978,7,-5,44,0.2916667,-3,-4,11,0.2554128,-7,-8,47,0.3095238,10,12,7,11.5,11,-11,34,59.5,-9,-10,13,0.268487,-12,-13,36,9.55,-14,-15],[-0.015502,-0.00048444,-0.0022426,-0.022973,0.015272,-0.031184,0.0158,-0.008968,-0.032848,0.0050854,-0.032399,0.022378,0.00314,-0.011335,0.016823]],[[28,0.1855,1,6,16,0.7083333,2,-6,10,0.2701351,-1,3,25,-0.04264543,4,-5,19,0.1846591,-2,5,2,19.5,-3,-4,12,0.7688689,7,9,14,292.5,-7,8,6,2.5,-8,-9,35,8.775,10,13,20,-2.189015,11,12,46,0.4142857,-10,-11,12,1.131527,-12,-13,35,9.45,-14,-15],[-6.8608e-05,0.007013,-0.027642,-0.0093433,0.0222,7.6238e-05,0.017659,-0.014004,0.00069798,0.0034839,-0.030542,0.013581,-0.019837,-0.028378,0.0011647]],[[28,0.1855,1,6,15,-6.855403,-1,2,42,4.9,3,-6,25,-1.411798,4,-5,39,9.833333,5,-4,12,0.617615,-2,-3,31,0.8444444,7,10,15,-3.44745,8,9,25,-0.124227,-7,-8,6,5.5,-9,-10,47,0.3095238,11,-15,6,5.5,12,-14,26,0.2371667,13,-13,14,1414.5,-11,-12],[-0.015825,0.003626,-0.0068965,0.0059648,-0.0019678,0.0034932,-0.0053709,0.012911,-0.0016696,-0.022596,0.0054215,-0.032938,0.0074387,0.0063153,0.016017]],[[33,9008.0,1,13,28,0.1855,2,8,15,-6.855403,-1,3,16,0.3666667,4,-7,7,2.5,-2,5,0,0.8221111,-3,6,4,16754.5,-4,7,2,70.5,-5,-6,19,0.2403846,9,12,15,-4.821585,10,11,2,21.5,-8,-9,30,3.9,-10,-11,32,0.4017544,-12,-13,36,9.55,-14,-15],[-0.015428,0.023174,-0.03166,0.027654,-0.034653,0.022976,-0.00032464,0.0047024,0.033895,-0.0029976,-0.034493,0.012183,0.0028448,-0.010432,0.015977]],[[28,0.079,1,10,25,-1.411798,2,-10,4,1766.005,3,-9,34,147.625,4,9,21,0.5185,5,6,33,1052.167,-1,-2,21,0.6135,7,8,30,6.9,-3,-4,21,0.6685,-5,-6,23,6.5,-7,-8,34,26.0,11,12,4,2468.5,-11,-12,19,0.5505051,13,-15,24,-1.038218,-13,-14],[-0.0013317,0.019785,-0.045899,0.0217,0.019273,-0.037551,-0.039912,0.0068593,0.0031412,-0.0031091,0.039423,-0.014883,-0.0014476,0.0071113,0.0059503]],[[27,0.8166667,1,-15,0,0.831,2,13,29,0.55,3,9,34,451.75,4,7,1,340.0,5,6,34,34.5,-1,-2,2,29.5,-3,-4,22,0.9622507,-5,8,4,8148.0,-6,-7,0,0.457,-8,10,35,4.55,-9,11,34,144.1667,-10,12,12,0.8688014,-11,-12,22,0.8918129,-13,-14],[-0.051189,0.0095578,-0.019757,0.02726,0.035812,0.017636,-0.055903,0.030887,0.018873,-0.039366,0.019793,-0.033758,-0.0067504,-0.050134,0.00026567]],[[18,0.4142857,1,2,50,0.2916667,-1,-2,24,-0.5541913,3,11,16,0.55,4,10,24,-2.38858,-3,5,8,1.243645,-4,6,5,3.5,-5,7,0,0.497,8,-9,4,1878.5,-6,9,35,5.816667,-7,-8,24,-1.372948,-10,-11,4,10464.55,12,13,26,0.6115,-12,-13,32,0.826505,-14,-15],[-0.049878,0.0088261,0.04367,-0.054081,-0.014553,0.014218,-0.028949,0.0018113,0.00372,-0.00099618,0.0022374,0.019017,-0.01158,-0.040769,0.0098856]],[[28,0.079,1,2,25,-1.411798,-1,-2,34,26.0,3,4,4,2468.5,-3,-4,12,0.6479745,5,9,36,8.733333,6,-9,5,8.5,7,-8,6,10.5,8,-7,4,1878.5,-5,-6,5,6.5,10,13,20,-2.189015,-10,11,28,0.2558333,-11,12,12,1.131527,-12,-13,35,8.775,-14,-15],[0.0011163,-0.0031013,0.037464,-0.013883,-0.00061972,-0.022231,-0.0024572,0.0024119,0.014261,-0.00031965,0.0064658,0.023896,-0.04695,0.00038521,-0.012596]],[[13,0.003650096,1,4,50,0.4142857,2,-4,34,47.25,-1,3,15,-6.73891,-2,-3,11,-0.5345833,5,8,50,0.8166667,-5,6,15,-1.459604,-6,7,5,7.5,-7,-8,13,0.04370614,9,11,20,-2.751642,-9,10,0,0.565,-10,-11,34,175.1667,12,13,4,7642.5,-12,-13,4,2526.5,-14,-15],[-0.0098121,-0.026459,0.025325,0.0018815,0.0024819,-0.0086899,0.029779,-0.025616,-0.009715,0.016858,-0.00808,-0.00040334,-0.012062,-0.034574,0.0028705]],[[28,0.079,1,12,9,2.769816,2,11,39,8.775,3,7,37,2.633333,4,5,21,0.4355,-1,-2,11,0.2168751,6,-5,30,13.775,-3,-4,48,0.6333333,8,10,11,0.3628258,9,-8,0,0.3605556,-6,-7,21,0.1285,-9,-10,5,8.5,-11,-12,34,26.0,13,-15,12,0.2928952,-13,-14],[-0.0017809,-0.018446,-0.030347,0.024657,0.00046514,0.0099792,-0.00076975,-0.0046547,0.005619,-0.05102,-0.00073426,0.010209,-0.00034631,0.041182,0.00088492]],[[13,0.003650096,1,8,37,1.55,2,5,42,1.225,3,-4,33,736.5,-1,4,10,0.6100847,-2,-3,15,-2.465487,6,7,23,4.5,-5,-6,12,1.000005,-7,-8,37,2.585714,-9,9,4,1878.5,-10,10,11,-0.1111715,11,-15,39,6.944444,12,13,48,0.225,-11,-12,2,7.5,-13,-14],[-0.017297,0.02402,-0.019416,-0.0010255,-0.035941,-0.0040933,0.028794,-0.020929,-0.00087214,-0.01706,-0.024429,0.018554,0.021182,-0.00031095,0.0065514]],[[18,0.4142857,1,11,20,-2.324451,2,9,6,28.5,3,8,37,4.291667,4,-6,6,9.5,5,7,38,1.633333,6,-3,12,1.00614,-1,-2,2,16.5,-4,-5,22,0.9110672,-7,-8,20,-2.280387,-9,10,46,0.775,-10,-11,24,-1.372948,-12,12,2,8.5,13,-15,33,1927.25,-13,-14],[-0.04577,0.013411,0.033309,0.0037153,-0.065439,0.03467,0.037621,-0.034539,0.043383,0.010926,-0.051293,-0.00095569,0.0021825,0.021911,8.7931e-05]],[[18,0.4142857,-1,1,33,5410.25,-2,2,36,4.633333,3,4,26,0.1271667,-3,-4,24,-3.42841,5,6,6,9.5,-5,-6,37,4.291667,7,9,4,6201.5,-7,8,4,6422.408,-8,-9,36,7.291667,-10,10,26,0.05216667,-11,11,24,-2.812466,12,13,11,0.1394647,-12,-13,6,20.5,-14,-15],[0.0079068,-0.00054703,0.00018815,-0.054429,0.038157,-0.0074536,-0.030088,0.023617,0.00012383,-0.051391,0.037645,-0.048397,0.020365,0.017301,0.00038953]],[[33,5410.25,1,10,32,0.8066239,-1,2,9,0.3333333,3,4,32,0.8675439,-2,-3,4,2431.5,-4,5,2,5.5,-5,6,13,0.1682828,7,9,37,5.291667,-6,8,33,4483.333,-7,-8,37,5.416667,-9,-10,5,7.5,11,13,2,22.5,-11,12,22,0.9428105,-12,-13,4,6933.19,-14,-15],[0.00018581,-0.0095077,-0.03612,-0.02552,0.022579,-0.00036142,-0.039547,-0.0057226,-0.0046857,0.011277,0.014054,0.0076183,-0.011663,-0.027113,-0.00024365]],[[33,5410.25,-1,1,5,7.5,2,11,2,22.5,3,9,21,0.0635,4,6,5,1.5,5,-4,21,0.0365,-2,-3,24,-2.812466,7,-8,5,3.5,-5,8,22,0.9393382,-6,-7,27,0.6333333,-9,10,49,0.4166667,-10,-11,12,0.853766,12,-15,6,1.5,13,-14,34,965.0,-12,-13],[-0.00038307,0.030984,-0.029814,0.024079,-0.044448,-0.035263,0.03288,0.012176,-0.045311,0.0080366,-0.0089207,-0.049301,0.036618,0.0041195,-0.010765]],[[33,5410.25,1,12,32,0.8066239,-1,2,12,1.008184,3,-12,4,2410.5,-2,4,2,5.5,-3,5,4,6422.408,6,10,5,4.5,-4,7,0,0.9268889,8,-8,4,3672.97,-5,9,2,14.5,-6,-7,23,7.5,11,-11,20,-1.346297,-9,-10,5,7.5,-13,13,4,6933.19,-14,-15],[0.00015864,-0.026765,0.02105,-0.0018912,0.0044768,-0.046931,-0.01791,0.032109,-0.037528,0.005473,0.0048882,-0.026816,0.0071945,-0.025847,-4.5762e-05]],[[34,165.6667,1,8,4,7642.5,2,4,9,0.9256935,-1,3,21,0.0895,-2,-3,6,18.5,5,7,5,8.5,-4,6,21,0.3305,-5,-6,20,-0.6682182,-7,-8,4,2046.335,9,10,23,8.5,-9,-10,0,0.083,-11,11,5,7.5,-12,12,12,0.6435245,-13,13,4,7477.0,-14,-15],[0.0035836,0.0025683,-0.0034595,-0.035408,-0.00385,-0.061678,0.0031512,-0.027894,-0.0334,0.022642,0.027994,0.0035777,0.0048214,-0.013194,-0.0011307]],[[24,-0.5541913,1,8,25,-2.795847,2,3,9,2.845615,-1,-2,9,5.229517,4,-8,18,0.4142857,5,-7,50,0.2916667,-3,6,30,10.36667,7,-6,6,44.5,-4,-5,4,10464.55,9,12,26,0.6115,10,11,25,-1.562784,-9,-10,19,0.3923077,-11,-12,34,392.75,13,-15,26,0.6085,-13,-14],[-0.0090694,0.0077798,-0.04852,0.0074932,-0.034851,0.030756,-0.00042046,-0.027091,0.0011312,0.024537,0.018734,-0.026999,-0.049588,0.0010604,0.0098535]],[[21,0.6715,1,13,21,0.6605,2,9,21,0.6555,3,8,33,206.6667,-1,4,34,165.6667,5,6,4,7642.5,-2,-3,4,2046.335,-4,7,2,4.5,-5,-6,4,854.5,-7,-8,4,1296.5,-9,10,24,-1.171975,11,12,4,1878.5,-10,-11,4,3522.1,-12,-13,4,1878.5,-14,-15],[0.011795,-0.00018827,-0.010154,-0.022348,0.021395,0.0012345,0.025168,-0.046024,-0.047864,-0.061985,0.021431,0.029961,-0.038457,-0.060157,0.0056043]],[[24,-0.5541913,1,10,16,0.55,2,5,24,-2.38858,-1,3,8,1.243645,-2,4,5,3.5,-3,-4,31,0.7083333,6,7,30,4.875,-5,-6,26,0.4305,8,9,36,2.775,-7,-8,13,0.6257431,-9,-10,4,10464.55,11,13,26,0.6105,-11,12,19,0.3923077,-12,-13,23,7.5,-14,-15],[0.040868,-0.048307,-0.014037,-0.00016836,-0.00052181,-0.016915,0.0086499,0.0014043,-0.001315,-0.020698,0.019033,0.01956,-0.02384,-0.037086,0.0094095]],[[27,0.8166667,1,-15,37,0.3666667,2,4,5,5.5,3,-3,32,0.1123737,-1,-2,14,9183.0,5,-14,5,4.5,6,9,13,0.2167035,7,8,36,5.266667,-4,-5,34,124.1667,-6,-7,37,2.225,10,13,24,-1.69497,-8,11,34,107.75,-9,12,34,120.0833,-10,-11,34,80.25,-12,-13],[-0.051924,-0.0013314,0.010815,0.0041351,-0.033787,-0.0066221,0.029972,-0.023441,0.027457,-0.073639,0.0010546,0.011525,-0.051616,-0.043954,0.00025089]],[[34,67.16667,1,10,4,1296.5,2,3,20,-2.771769,-1,-2,2,15.5,4,-10,20,-2.805332,5,7,4,2161.615,6,-5,5,2.5,-3,-4,2,7.5,8,9,4,3126.275,-6,-7,5,7.5,-8,-9,4,1030.977,11,13,34,137.1,12,-13,23,7.5,-11,-12,34,92.625,-14,-15],[-0.010508,0.0096141,0.039721,-0.0047433,-0.029673,-0.039056,0.0050545,-0.019166,0.0017786,0.0036157,-0.033778,0.012272,0.014764,0.0069055,-0.00011208]],[[33,7546.5,1,10,16,0.3666667,2,6,48,0.6333333,3,4,6,64.5,-1,-2,0,0.621,-3,5,20,-0.7613364,-4,-5,24,-0.5541913,-6,7,26,0.6705,8,-10,4,13300.32,-7,9,36,7.875,-8,-9,11,0.1394647,11,-15,36,8.583333,12,-14,4,8560.476,-11,13,2,15.5,-12,-13],[-0.020135,0.018254,-0.017693,0.052623,-0.034288,-0.00022616,0.014067,-0.0418,0.019411,-0.043637,0.024281,-0.054696,-0.013481,0.0066155,0.013816]],[[12,1.131527,1,9,34,165.6667,2,6,4,7642.5,-1,3,6,18.5,4,5,5,8.5,-2,-3,20,-0.6682182,-4,-5,4,2046.335,7,8,35,8.9,-6,-7,0,0.083,-8,-9,39,6.763889,10,13,0,0.8384444,11,-13,32,0.2925,-10,12,44,1e-35,-11,-12,28,0.33125,-14,-15],[0.00012762,-0.033553,-0.0072509,0.0037465,-0.026771,-0.032377,0.020715,0.026968,0.0015432,0.0039536,-0.038871,-0.002944,0.01488,0.002376,-0.037588]],[[31,0.8444444,1,11,30,4.708333,2,10,21,0.1055,-1,3,26,0.1381667,-2,4,26,0.1885833,5,6,26,0.1831667,-3,-4,2,20.5,7,-9,23,7.5,8,-8,22,0.5435606,-5,9,26,0.2062,-6,-7,48,0.7083333,-10,-11,21,0.4305,-12,12,39,6.944444,-13,13,13,0.4488046,-14,-15],[-0.0033333,0.014943,-0.0067335,-0.048072,-0.0028001,0.048517,0.0057952,-0.017613,0.013596,-0.017589,0.038224,0.0017969,-0.017375,0.0060639,-0.015663]],[[14,208.0,-1,1,34,57.25,2,-15,33,965.25,3,12,21,0.0155,4,5,20,-1.414179,-2,-3,21,0.2685,-4,6,26,0.35375,-5,7,12,0.581879,8,-11,21,0.4315,-6,9,33,611.125,10,11,12,0.2928952,-7,-8,12,0.2159427,-9,-10,26,0.03016667,13,-14,21,0.0255,-12,-13],[0.011669,-0.027361,0.034371,0.0036423,-0.044055,0.017798,-0.015035,0.014259,0.0046111,-0.04327,0.010298,-0.0085478,0.047375,-0.020446,0.0003183]],[[25,-2.971001,-1,1,28,0.079,-2,2,19,0.5505051,3,4,24,-1.038218,-3,-4,6,14.5,5,9,2,19.5,6,-9,6,5.5,7,-8,14,3929.5,-5,8,24,-1.806949,-6,-7,19,0.8660714,10,13,20,-1.594864,-10,11,8,3.133687,-11,12,7,4.5,-12,-13,7,1.5,-14,-15],[0.0058098,-0.0012174,-0.0012242,0.0072431,0.0062592,0.0089735,-0.043151,0.017331,-0.017254,0.013523,0.012616,-0.039122,-0.0011904,0.0091293,0.034753]],[[13,0.003650096,1,11,39,1.291667,2,3,26,0.3205833,-1,-2,2,10.5,4,7,40,0.2916667,-3,5,42,1.291667,6,-6,26,0.01116667,-4,-5,31,0.8444444,8,9,24,-1.910231,-7,-8,50,0.6333333,-9,10,15,-3.520595,-10,-11,11,-1.285069,12,-15,49,1e-35,13,-14,43,2.291667,-12,-13],[0.022872,-0.028033,-0.01543,-0.030246,0.027946,0.0015139,-0.0045736,-0.032563,0.01634,-0.013267,0.011188,-0.016004,0.00098648,0.019672,-9.7056e-06]],[[13,0.003650096,1,10,36,8.733333,2,-10,33,1314.25,3,5,39,4.125,-1,4,41,0.3095238,-2,-3,39,1.291667,-4,6,2,10.5,7,8,36,5.414286,-5,-6,19,0.3693182,9,-9,35,8.9,-7,-8,20,-4.60396,-11,11,25,-2.971001,12,13,43,0.4166667,-12,-13,9,5.510233,-14,-15],[-0.025902,-0.0050984,0.023405,0.028851,0.023396,-0.0046428,-0.020347,0.01414,0.0086715,-0.017348,-0.028391,0.016601,0.0017907,-0.00026921,-0.0281]],[[13,0.003650096,1,6,37,1.55,2,5,42,1.225,3,-4,15,-6.73891,-1,4,10,0.6658333,-2,-3,43,4.916667,-5,-6,34,26.0,7,9,28,0.04366667,-7,8,12,0.2928952,-8,-9,34,55.25,10,-15,26,0.2681667,11,13,26,0.2545833,12,-12,26,0.1724167,-10,-11,26,0.34465,-13,-14],[-0.03183,0.020644,-0.020365,-0.00083903,-0.0098906,0.0094397,-0.0063532,0.0014368,0.038572,0.00098922,-0.017474,0.014182,-0.041299,-0.0039785,8.8488e-05]],[[14,208.0,-1,1,34,57.25,2,-15,4,1555.5,3,8,20,-1.823783,4,-7,26,0.1724167,5,6,21,0.1145,-2,-3,26,0.1761667,7,-6,32,1e-35,-4,-5,2,16.5,9,12,4,3720.5,10,-11,26,0.03016667,11,-10,4,2410.5,-8,-9,4,7859.55,13,-14,26,0.0891,-12,-13],[0.011305,-0.012501,0.016193,0.0362,-0.06616,-0.0094014,0.010675,0.027662,-0.042219,-0.027405,0.0029041,-0.011735,0.019925,-0.030372,0.00028741]],[[21,0.6695,1,11,21,0.6605,2,10,21,0.6555,3,-9,28,0.08366667,4,-8,25,-1.411798,5,7,24,-0.9551432,-1,6,30,9.708333,-2,-3,5,5.5,8,-7,25,-0.4426379,-4,9,37,1.291667,-5,-6,24,-1.260522,-10,-11,12,0.9776643,12,-15,39,6.944444,13,-14,0,0.123,-12,-13],[0.0022947,-0.0095525,0.014509,-0.00335,-0.03302,-0.0070938,-0.00041831,0.00117,-0.028043,-0.048454,0.026494,0.014513,-0.040564,0.020567,-0.055627]],[[34,26.0,1,4,4,3494.0,2,-4,28,0.021,3,-3,4,1114.566,-1,-2,34,57.25,5,-15,4,1555.5,6,10,20,-1.823783,7,-9,21,0.2685,8,9,21,0.2625,-5,-6,21,0.4375,-7,-8,2,12.5,11,13,4,4462.8,12,-12,21,0.1285,-10,-11,20,-0.7413012,-13,-14],[-0.021008,0.011165,0.030843,-0.018488,-0.0035574,0.034585,-0.056685,0.0010372,0.010426,-0.0067096,-0.039281,0.017807,0.0036373,-0.034191,0.00024727]],[[28,0.3725,1,6,28,0.3516667,2,5,42,4.9,-1,3,37,2.291667,-2,4,4,4812.67,-3,-4,38,4.9,-5,-6,32,0.1376263,-7,7,13,0.2330774,8,11,28,0.3925,-8,9,10,0.6050641,10,-11,12,1.06847,-9,-10,0,0.2384444,12,-15,4,3237.5,13,-14,24,-0.7181369,-12,-13],[-0.00043401,-0.00055566,0.018553,0.0020679,-0.023602,0.029631,0.023334,0.028625,0.0043432,-0.035271,0.049138,-0.051852,0.02112,-0.0032012,0.0033413]],[[34,26.0,1,6,4,2453.02,2,4,28,0.05366667,3,-3,4,1084.5,-1,-2,26,0.3631667,5,-6,4,3458.39,-4,-5,31,0.8444444,7,8,6,16.5,-7,-8,6,2.5,-9,9,16,0.7083333,10,11,10,0.1750706,-10,-11,2,19.5,-12,12,6,9.5,-13,13,22,0.2788889,-14,-15],[-0.021208,0.012737,0.034824,0.039942,-0.010516,-0.031877,-0.00018634,-0.016001,-0.0051437,0.0026659,-0.010259,0.0074001,-0.012767,0.022179,0.0011974]],[[21,0.6695,1,11,21,0.6605,2,9,21,0.6555,3,8,14,208.0,-1,4,13,0.004813819,5,-6,39,1.291667,-2,6,24,-1.302947,-3,7,18,0.6333333,-4,-5,4,854.5,-7,-8,24,-1.260522,-9,10,4,3522.1,-10,-11,4,1868.035,12,13,0,0.143,-12,-13,3,1.5,-14,-15],[0.011088,0.016478,-0.00098003,0.027729,0.0033632,-0.00030059,0.024947,-0.044196,-0.045145,0.028729,-0.038503,-0.0080385,-0.071729,0.020022,-0.036913]],[[21,0.6695,1,11,21,0.6605,2,9,21,0.6555,3,8,34,26.0,4,-6,4,2453.02,5,7,25,-0.6907775,-1,6,12,0.7646596,-2,-3,21,0.3635,-4,-5,4,854.5,-7,-8,24,-1.260522,-9,10,4,3522.1,-10,-11,4,1868.035,12,13,0,0.143,-12,-13,3,1.5,-14,-15],[-0.0044223,0.035381,-0.014516,0.0067621,-0.030164,-0.00012469,0.024528,-0.042447,-0.042555,0.028057,-0.038471,-0.0079501,-0.070252,0.019487,-0.036303]],[[34,26.0,1,3,28,0.04366667,-1,2,4,1951.0,-2,-3,28,0.1336667,-4,4,19,0.3484848,5,-15,26,0.2021667,6,10,26,0.1724167,7,8,36,2.633333,-5,-6,34,110.125,-7,9,22,0.8038462,-8,-9,35,4.291667,11,12,13,0.1352346,-10,-11,24,-1.791408,-12,13,26,0.2331667,-13,-14],[-0.0052869,0.035204,-0.0016832,-0.00070344,0.0098288,-0.0053136,-0.045298,0.011101,-0.034394,0.0086268,-0.0096395,0.018782,-0.04536,0.0041824,0.0047464]],[[16,0.3666667,1,12,7,2.5,2,3,43,7.291667,-1,-2,0,0.8221111,4,7,28,0.2108333,5,-6,4,8355.0,6,-5,4,7392.71,-3,-4,4,16754.5,-7,8,13,0.2266805,-8,9,7,5.5,10,11,19,0.8660714,-9,-10,35,5.416667,-11,-12,20,-0.5541913,-13,13,13,0.4488046,-14,-15],[0.034637,-0.040982,-0.029144,0.048347,-0.042279,0.015547,0.020334,-0.038668,-0.039387,0.02766,-0.022013,0.044169,-4.8017e-05,0.014812,-0.0046498]],[[34,26.0,1,3,28,0.04366667,-1,2,4,1951.0,-2,-3,28,0.1336667,4,11,16,0.9,5,-11,4,1695.5,-4,6,4,3642.697,-5,7,24,-1.090849,8,-10,30,1e-35,9,10,26,0.2621667,-6,-7,36,3.416667,-8,-9,19,0.3038462,-12,12,4,1221.936,-13,13,21,0.6105,-14,-15],[-0.0050569,0.034754,-0.0013901,0.017668,-0.02911,-0.013214,0.050805,0.0081655,-0.017894,0.0014009,-0.00014535,-0.0013869,0.025057,0.003907,-0.036231]],[[34,26.0,1,3,28,0.04366667,-1,2,12,0.2928952,-2,-3,28,0.1336667,-4,4,19,0.3484848,5,-15,26,0.2001667,6,9,21,0.1545,7,-8,22,0.05409357,-5,8,20,-2.495123,-6,-7,30,3.9,10,-14,2,20.5,11,-13,9,0.8225786,-9,12,21,0.2685,-10,13,20,-1.726858,-11,-12],[-0.0048243,0.0033291,0.034029,-0.00068415,0.020069,0.00016984,-0.010494,-0.02105,0.007027,0.0022296,-0.055392,-0.0065043,0.019468,-0.01069,0.0043375]],[[12,1.131527,1,12,24,-1.10582,-1,2,13,0.5313737,3,-12,39,3.225,4,7,21,0.4305,5,6,37,2.45,-2,-3,21,0.6495,-4,-5,16,0.6333333,8,10,6,26.5,9,-8,21,0.6115,-6,-7,0,0.4778889,-9,11,26,0.2405833,-10,-11,42,2.083333,-13,13,14,2882.5,-14,-15],[-0.00038031,0.0081982,-0.021766,-0.036602,0.0096003,-0.0060767,-0.049276,0.0067585,0.016349,-0.0067654,0.010996,-0.0033652,-0.013608,0.022272,-0.0035692]],[[13,0.004813819,1,11,33,1186.25,2,5,32,0.2635234,-1,3,35,5.816667,4,-4,26,0.4275,-2,-3,2,10.5,6,8,35,5.816667,-5,7,25,-0.2556878,-6,-7,24,-3.14953,-8,9,19,0.3693182,-9,10,24,-1.791408,-10,-11,48,0.8166667,-12,12,4,2208.5,-13,13,2,16.5,-14,-15],[0.0034051,-0.053352,0.010997,0.012484,0.022329,0.010503,-0.034152,0.029825,-0.01084,-0.015077,0.012062,3.3844e-05,0.0056121,-0.040663,4.1748e-08]],[[34,26.0,1,7,4,3522.1,2,-7,13,0.2365123,3,4,4,1435.0,-1,-2,25,-0.833787,-3,5,4,1455.5,-4,6,2,16.5,-5,-6,25,-2.795847,8,11,37,0.9444444,-8,9,4,1155.0,-9,10,5,5.5,-10,-11,9,5.229517,12,-15,28,0.1336667,-12,13,5,5.5,-13,-14],[-0.047289,0.026862,-0.0004925,0.038909,-0.0019604,0.048944,-0.016546,0.01589,-0.028518,-0.0033343,0.0095187,-0.00087674,0.0039801,-0.0014682,-0.025321]],[[13,1e-35,1,5,15,-3.063867,2,-5,8,2.614608,3,4,5,8.5,-1,-2,33,1346.167,-3,-4,11,-1.285069,6,-15,39,9.1,7,12,33,1304.167,8,10,34,107.75,9,-8,20,-2.280387,-6,-7,34,136.5833,-9,11,50,0.3666667,-10,-11,15,-4.580136,-12,13,24,-1.21694,-13,-14],[-0.038638,0.019385,-0.0064463,0.021874,0.034888,-0.018044,0.012165,-0.04623,0.017584,0.018205,-0.012077,0.0033393,-0.025944,0.0036243,9.9706e-05]],[[33,9008.0,1,13,49,0.875,-1,2,24,-3.42841,-2,3,19,0.08957219,4,11,4,12080.01,5,-10,21,0.2545,6,-9,4,1795.597,-3,7,2,8.5,-4,8,0,0.347,-5,9,5,3.5,-6,10,20,-3.03866,-7,-8,2,25.5,-11,12,0,0.871,-12,-13,36,9.55,-14,-15],[-0.00033698,0.029239,0.031036,-0.06001,0.019504,-0.033686,0.019536,-0.011846,-0.046813,-0.049741,0.017323,-0.023558,0.019052,-0.010572,0.0144]],[[34,26.0,1,5,13,0.2330774,2,3,14,1058.5,-1,-2,13,0.7122632,4,-5,9,1.586448,-3,-4,31,0.8444444,6,7,44,0.3666667,-6,-7,16,0.55,8,13,24,-1.459038,-8,9,7,3.5,10,11,2,69.0,-9,-10,16,0.3666667,-11,12,2,20.5,-12,-13,32,0.4017544,-14,-15],[-0.050994,0.020142,0.033068,-0.0060287,-0.0012862,-0.00016583,-0.0096732,-0.032614,-0.014693,0.028291,-0.012964,-0.0075079,0.012381,0.0052673,0.00039344]],[[20,-0.5541913,1,12,25,-2.795847,2,7,37,0.9444444,-1,3,12,0.6704185,4,6,37,1.916667,-2,5,20,-1.013783,-3,-4,33,1204.25,-5,-6,15,-4.741945,8,-12,25,-0.08333333,9,-11,12,0.5863176,10,11,6,5.5,-7,-8,33,1327.167,-9,-10,10,0.06516332,-13,13,7,12.5,-14,-15],[0.014427,-0.016079,0.014573,-0.0078497,-0.027805,0.0012592,0.018042,-0.0051252,-0.012357,-0.0037355,0.012956,9.2199e-05,0.012746,-0.01345,0.04207]],[[25,-2.795847,1,2,19,0.6458333,-1,-2,9,5.229517,3,-15,24,-0.5541913,4,12,21,0.1385,5,6,0,0.8836667,-3,-4,26,0.1525833,7,-11,22,0.6978261,8,-10,5,1.5,-5,9,21,0.1435,-6,10,43,0.9166667,11,-9,21,0.1455,-7,-8,10,0.06516332,-12,13,19,0.19375,-13,-14],[0.0065544,-0.011162,0.0015358,-0.0070856,-0.039359,0.018099,0.030757,-0.013321,-0.042202,-0.044884,-0.0005566,0.01238,0.034013,-0.014928,-0.02437]],[[21,0.6695,1,11,21,0.6605,2,7,21,0.6555,3,4,33,9008.0,-1,-2,4,854.5,-3,5,20,-0.7413012,6,-6,4,2247.5,-4,-5,20,-1.255793,-7,8,4,3522.1,9,-11,4,1489.5,10,-10,21,0.6675,-8,-9,4,1868.035,12,13,0,0.143,-12,-13,12,0.9776643,-14,-15],[-0.00013744,0.0067363,0.024134,-0.064316,0.012703,0.020092,-0.041353,0.030173,-0.034196,0.031181,-0.037129,-0.00766,-0.06857,0.020029,-0.028362]],[[13,0.004813819,1,11,39,1.291667,-1,2,24,-1.302947,3,-11,32,0.2925,4,9,39,4.125,-2,5,22,0.270979,6,-7,24,-2.812466,-3,7,19,0.4833333,8,-6,14,1036.5,-4,-5,26,0.3711667,10,-10,22,0.6132479,-8,-9,20,-4.60396,-12,12,11,-0.5345833,13,-15,37,3.55,-13,-14],[0.016174,-0.030456,0.024771,0.011714,-0.047888,0.017324,0.033664,-0.019128,-0.0027126,0.018146,0.011008,-0.027309,-0.00052535,-0.013045,0.00019577]],[[13,0.004813819,1,8,50,0.4142857,2,4,42,2.708333,-1,3,21,0.0125,-2,-3,21,0.0375,5,-8,14,4182.5,6,-7,22,0.4522727,7,-6,26,0.03225,-4,-5,37,7.833333,9,10,37,6.166667,-9,-10,4,5369.925,11,12,21,0.3635,-11,-12,26,0.1381667,-13,13,12,0.7176637,-14,-15],[0.016557,0.036819,-0.026023,0.026445,-0.042243,-0.040957,0.0050655,0.0045348,-0.0002801,-0.038549,-0.010003,-0.058616,0.031039,0.017663,-0.0085472]],[[18,0.4142857,1,-15,0,0.7268889,2,6,2,28.5,3,5,28,0.2255,4,-3,4,3126.275,-1,-2,4,4812.67,-4,-5,21,0.0765,7,-14,4,17894.97,8,12,7,5.5,9,10,22,0.9814815,-6,-7,22,0.9486842,-8,11,50,0.6333333,-9,-10,0,0.8663333,-11,13,4,21707.5,-12,-13],[-0.034452,0.009645,-0.033239,0.027323,-0.058243,0.02139,-0.043634,-0.04945,-0.030362,0.037896,0.046134,-0.052889,0.016438,0.028334,-0.00012628]],[[33,5410.25,1,12,32,0.8066239,-1,2,12,1.008184,3,-12,4,2410.5,-2,4,2,5.5,-3,5,36,5.266667,-4,6,12,0.8346498,7,9,21,0.4315,8,-7,2,12.5,-5,-6,37,4.708333,10,11,20,-1.911444,-8,-9,33,4483.333,-10,-11,5,7.5,-13,13,12,0.853766,-14,-15],[0.0001854,-0.025118,0.01891,-0.01176,-0.015155,0.0062439,-0.045523,-0.0094807,0.013741,-0.039105,-0.0011006,-0.024809,0.0066414,0.0026471,-0.01016]],[[33,3196.25,1,4,4,17283.92,-1,2,30,7.708333,-2,3,20,-0.5541913,-3,-4,5,7.5,5,10,21,0.3635,6,-10,35,9.291667,7,9,21,0.2695,-5,8,21,0.2795,-6,-7,4,4812.67,-8,-9,4,7184.797,11,-15,21,0.1045,-11,12,4,6500.0,-12,13,20,-0.8749412,-13,-14],[-0.00038169,-0.037746,0.0054456,-0.056054,0.0029996,-0.030251,0.0099996,-0.037221,0.011657,-0.025792,-0.0020373,-0.015462,-0.068203,0.018024,0.0012315]],[[33,3196.25,1,5,35,8.45,-1,2,2,9.5,-2,3,5,1.5,-3,4,26,0.05216667,-4,-5,5,7.5,6,9,26,0.3631667,7,8,0,0.243,-6,-7,0,0.8384444,-8,-9,13,0.2297853,10,13,0,0.551,-10,11,14,8863.0,12,-13,9,1.223316,-11,-12,2,13.5,-14,-15],[-0.00026479,-0.037103,0.015011,0.01353,-0.015949,0.030712,0.0038321,-0.034263,0.0084772,-0.00023562,-0.036504,-0.0081764,-0.0047888,-0.019249,0.0045921]],[[33,3196.25,1,6,4,17283.92,2,5,32,0.826505,-1,3,11,0.1394647,4,-4,6,30.5,-2,-3,7,3.5,-5,-6,5,7.5,7,10,21,0.3635,8,-10,2,25.5,-7,9,26,0.03225,-8,-9,4,7184.797,11,-15,32,0.8740079,-11,12,11,-0.1111715,-12,13,9,2.690987,-13,-14],[-0.00012224,-0.031062,0.029069,-0.00070736,-0.038031,0.00175,0.0071024,-0.027205,0.001903,-0.023718,-0.0008528,-0.013583,-0.056601,0.0032476,0.0012075]],[[13,0.004813819,1,8,37,1.916667,2,5,42,1.225,3,-4,15,-6.73891,-1,4,10,0.6750635,-2,-3,42,1.775,6,7,12,0.9979325,-5,-6,39,6.291667,-7,-8,37,7.833333,-9,9,4,5369.925,10,11,7,2.5,-10,-11,26,0.1381667,12,13,20,-2.635972,-12,-13,12,0.7176637,-14,-15],[-0.027966,0.017692,-0.022563,0.00023949,0.0061934,-0.019799,-0.011405,0.013941,-0.00034939,-0.029025,0.02582,0.00029951,0.03921,0.016825,-0.008402]],[[33,3148.167,1,-15,34,402.75,2,13,38,5.875,3,11,12,0.7328118,4,6,40,0.775,5,-3,5,6.5,-1,-2,39,3.225,7,-9,34,140.125,8,-8,21,0.0685,-4,9,26,0.1391667,-5,10,43,0.4166667,-6,-7,21,0.1245,12,-12,0,0.109,-10,-11,12,0.5525113,-13,-14],[-0.0034617,0.0059466,-0.0081585,-0.024686,0.024735,0.014547,-0.019644,-0.019815,0.0031275,-0.047582,0.015788,-0.052798,0.0094195,-0.029068,0.0014649]],[[18,0.4142857,1,-15,0,0.7268889,2,11,8,6.263029,3,9,38,2.875,4,8,46,0.6333333,5,7,0,0.3826667,6,-3,26,0.1391667,-1,-2,32,0.425463,-4,-5,11,-0.4359922,-6,-7,34,373.1667,10,-10,11,1e-35,-8,-9,43,6.8375,12,13,12,0.8650316,-11,-12,9,2.041247,-13,-14],[0.025128,-0.042702,0.020188,0.015484,-0.040691,0.011926,-0.054986,-0.060708,0.0096893,0.016806,0.028286,0.0076183,-0.036802,0.025421,-0.00012238]],[[24,-1.21694,1,-15,15,-3.007197,-1,2,26,0.5895,3,-14,37,4.888889,4,11,37,3.875,5,8,37,2.928571,-2,6,26,0.2681667,-3,7,26,0.2721667,-4,-5,26,0.2425833,9,-9,22,0.3021739,10,-8,26,0.1141667,-6,-7,12,0.7486747,-10,12,24,-2.464225,-11,13,43,3.916667,-12,-13],[0.00067324,-0.0054562,0.013942,-0.037294,0.0032271,0.0043534,-0.036437,-0.036413,0.017523,0.017734,-0.039763,-0.023664,0.011996,0.013099,0.0015221]],[[13,1e-35,1,3,16,0.6333333,-1,2,33,849.25,-2,-3,20,-4.674491,-4,4,18,0.4142857,5,-15,25,-0.1697751,6,7,42,1.055556,-5,-6,5,10.5,8,-14,24,-1.459038,9,-13,9,1.837118,10,-12,26,0.14225,11,-11,7,6.5,12,-10,30,3.9,13,-9,20,-2.376902,-7,-8],[-0.024549,-0.011178,0.017666,-0.028866,0.0095364,-0.015741,-0.026918,0.024843,-0.040155,0.035786,-0.0074083,0.027456,0.032586,-0.013502,-0.00018364]],[[42,4.9,-1,1,46,0.775,2,12,15,-4.863332,-2,3,26,0.2425833,4,7,21,0.1225,5,-6,26,0.1885833,6,-5,26,0.1161667,-3,-4,4,16754.5,8,-12,4,4812.67,9,-11,32,0.08514493,10,-10,4,3261.5,11,-9,4,1155.0,-7,-8,45,0.3666667,-13,13,15,-2.809476,-14,-15],[-0.00033565,0.014668,-0.0021233,0.02048,-0.025346,-0.012787,0.0122,-0.043066,0.033968,0.015615,-0.0045829,0.015967,-0.0093125,0.0033452,0.023329]],[[28,0.08366667,1,4,3,1.5,-1,2,10,0.195061,-2,3,19,0.1519231,-3,-4,19,0.5505051,-5,5,6,10.5,6,12,0,0.3826667,-6,7,20,-1.74548,8,11,22,0.9148551,9,-10,35,6.45,10,-9,21,0.1295,-7,-8,29,0.55,-11,-12,9,1.760191,13,-15,16,0.775,-13,-14],[6.8749e-05,0.0026553,0.0043155,-0.011984,-0.000114,0.0079413,0.010218,-0.043535,0.044971,-0.033003,-0.035826,-0.0091371,0.00524,0.021201,-0.0045322]],[[42,4.9,1,2,12,1.131527,-1,-2,46,0.775,3,12,26,0.2425833,4,11,21,0.1225,5,-10,12,0.9807172,6,-9,22,0.3660287,7,8,34,32.25,-3,-4,32,0.4505639,-5,9,36,5.633333,-6,10,7,6.5,-7,-8,12,0.2159427,-11,-12,45,0.3666667,-13,13,15,-2.809476,-14,-15],[-0.00019096,-0.0097566,0.016278,-0.027174,0.01937,-0.014015,0.0052317,-0.040114,0.015798,-0.010874,0.027665,0.0036202,-0.0095319,0.0035232,0.021222]],[[42,4.9,1,-15,28,0.1808333,2,7,15,-6.855403,-1,3,8,1.620342,4,-6,24,-1.21694,5,-5,43,2.416667,6,-4,49,0.4166667,-2,-3,5,5.5,8,12,11,0.6446022,9,-11,20,-2.189015,-7,10,13,0.3310493,11,-10,28,0.2558333,-8,-9,19,0.5669643,13,-14,20,-0.7179443,-12,-13],[-0.016415,-0.030787,0.022503,-0.0037909,-0.0015574,-0.00040961,0.00089309,0.0095414,0.025729,-0.0020633,-0.013915,-0.0055423,0.031017,0.0082396,0.002597]],[[28,0.08366667,1,7,3,1.5,-1,2,10,0.195061,3,4,5,4.5,-2,-3,30,10.1,5,6,12,0.7486747,-4,-5,22,0.6809091,-6,-7,9,1.895263,8,13,5,5.5,9,10,12,0.6479745,-8,-9,10,0.04505639,11,-13,31,0.7083333,12,-12,26,0.5895,-10,-11,8,3.050104,-14,-15],[7.9963e-05,-0.0097678,0.0059789,0.0013168,-0.010872,-0.0039324,-0.031668,-0.0021959,0.0062116,-0.012925,0.016775,0.00094237,0.0050077,-0.021105,-0.0015751]],[[28,0.08366667,-1,1,19,0.5505051,2,9,5,5.5,3,-9,13,0.3794407,4,-8,20,-2.189015,-2,5,2,15.5,-3,6,50,0.8166667,-4,7,35,9.291667,8,-7,20,-1.694825,-5,-6,6,5.5,10,12,2,15.5,-10,11,22,0.6306043,-11,-12,20,-0.7813623,13,-15,8,4.865067,-13,-14],[-0.00077521,-0.00035271,0.014803,0.010108,-0.026955,-0.0022128,0.011335,-0.0055391,-0.0027511,0.0030529,-0.0024041,-0.035509,0.013839,-0.0010837,-0.0095798]],[[28,0.08366667,1,2,9,2.875277,-1,-2,19,0.5505051,3,13,5,5.5,4,5,9,0.9729551,-3,-4,10,0.04505639,6,12,21,0.559,7,-11,24,-1.372948,8,11,8,1.243645,9,10,21,0.4155,-5,-6,49,0.5833333,-7,-8,21,0.4285,-9,-10,0,0.9384444,-12,-13,25,-1.086651,-14,-15],[-0.0017445,0.0023164,0.0060438,-0.0018616,-0.052005,0.017955,-0.01278,0.0056711,0.002287,-0.019099,0.014132,0.0022705,-0.02146,-0.026626,0.0061966]],[[13,1e-35,1,8,15,-3.063867,2,-8,8,2.614608,3,4,43,1.416667,-1,-2,4,1509.5,-3,5,24,-3.14953,-4,6,19,0.3923077,7,-7,8,4.182718,-5,-6,48,0.8166667,-9,9,4,2208.5,10,12,4,772.5,-10,11,26,0.30625,-11,-12,2,16.5,-13,13,4,5527.49,-14,-15],[-0.00022358,-0.057602,-0.011513,0.044245,0.01146,-0.033776,0.025954,0.033737,0.00011611,-0.03833,0.011866,-0.090519,-0.038965,0.009765,-0.030963]],[[18,0.4142857,1,-15,21,0.1565,2,-14,0,0.7268889,3,6,4,15821.0,4,-4,20,-1.694825,5,-3,24,-1.432689,-1,-2,21,0.0835,7,-13,4,17894.97,8,13,0,0.9557778,9,-10,20,-1.911444,10,11,7,7.5,-5,-6,20,-1.460698,12,-9,0,0.729,-7,-8,20,-2.241885,-11,-12],[0.0028619,-0.050974,0.032466,-0.036995,0.012169,-0.044923,0.013406,-0.081071,0.028056,0.032483,-0.023229,0.037066,0.036207,-0.043229,-0.00012574]],[[18,0.4142857,1,10,0,0.7268889,2,-10,8,6.263029,3,9,4,15821.0,4,8,0,0.6605556,5,7,19,0.8660714,-1,6,29,0.55,-2,-3,32,0.6757353,-4,-5,2,21.5,-6,-7,26,0.1161667,-8,-9,33,7546.5,-11,11,13,0.457311,12,-15,32,0.9013889,13,-14,19,0.3038462,-12,-13],[0.014,0.018419,-0.0635,-0.04933,0.019695,0.014233,-0.061041,0.0071133,-0.047296,0.014908,-0.00032108,-0.019421,0.00118,0.0071177,0.019327]],[[18,0.4142857,1,-15,24,-1.974683,-1,2,7,5.5,-2,3,0,0.8557778,4,13,0,0.7268889,5,11,32,0.5793288,6,10,41,0.3666667,7,9,0,0.6605556,8,-5,0,0.403,-3,-4,26,0.0891,-6,-7,41,0.6333333,-8,-9,12,0.736909,-10,12,50,0.5857143,-11,-12,35,6.291667,-13,-14],[-0.013647,0.018201,-0.024706,0.036555,-0.035465,0.02381,-0.054901,-0.062033,0.028852,0.04559,-0.036699,0.017944,0.021352,-0.065222,-0.00013528]],[[18,0.4142857,1,6,24,-1.974683,2,3,23,8.5,-1,-2,21,0.0135,4,-6,24,-1.741919,-3,5,30,7.1,-4,-5,16,0.4642857,7,10,48,0.55,8,9,0,0.949,-7,-8,20,-0.7813623,-9,-10,20,-0.5541913,-11,11,25,-1.562784,-12,12,12,0.3608816,13,-15,30,10.9,-13,-14],[-0.039941,0.0041345,0.0261,-0.068458,0.017528,0.013353,-0.01763,0.012803,0.037963,-0.019067,-0.00017493,-0.0046224,-0.030016,0.017628,0.018079]],[[18,0.4142857,1,2,21,0.1565,-1,-2,28,0.3725,3,8,28,0.3516667,4,-8,28,0.29125,-3,5,35,8.9,6,-7,0,0.4721111,7,-6,8,2.022332,-4,-5,13,0.2330774,9,12,23,3.5,-9,10,12,1.000005,-10,11,10,0.03508794,-11,-12,36,2.9,-13,13,34,95.25,-14,-15],[0.0082997,-0.041415,-0.00036048,0.020265,-0.0074491,0.022424,-0.015432,-0.016399,0.027881,0.011882,-0.040031,0.0083472,0.013237,-0.048206,-0.0052152]],[[18,0.4142857,-1,1,15,-6.73891,2,10,21,0.0425,-2,3,37,2.183333,4,9,23,7.5,5,7,18,0.7638889,6,-5,24,-3.235026,-3,-4,24,-1.582749,-6,8,24,-1.372948,-7,-8,42,5.45,-9,-10,13,1e-35,11,-15,0,0.5057778,12,-14,15,-2.125337,13,-13,43,0.9166667,-11,-12],[0.0067661,-0.02563,0.028325,-0.03034,0.016578,0.038192,-0.032244,0.017231,-0.037238,0.031143,0.014971,-0.014326,0.036762,0.036622,-0.00011746]],[[33,3148.167,1,-15,4,17283.92,2,13,38,5.875,3,10,4,4812.67,4,6,23,9.5,-1,5,4,4188.51,-2,-3,32,0.4216374,7,9,2,25.5,8,-6,22,0.7211111,-4,-5,36,7.55,-7,-8,21,0.1245,11,12,0,0.109,-9,-10,4,3104.5,-11,-12,7,2.5,-13,-14],[0.00050339,-0.043907,0.014243,-0.0069547,0.014345,0.018542,-0.009347,0.0023685,-0.044649,0.01496,-0.064512,-0.004138,-0.042961,-0.0049576,0.001449]],[[28,0.29125,1,2,34,165.6667,-1,-2,36,4.291667,3,10,0,0.6336667,4,-10,8,1.620342,5,6,6,1e-35,-3,-4,26,0.5195,7,-9,4,2115.824,8,9,38,5.875,-5,-6,38,4.583333,-7,-8,34,87.41667,-11,11,20,-2.302558,-12,12,21,0.3025,13,-15,26,0.03425,-13,-14],[-0.0010859,0.00090993,0.028852,-0.0011703,0.015625,-0.021123,-0.0090263,0.024112,-0.041456,0.022747,-0.031886,-0.0089196,-0.017256,0.014996,-0.034307]],[[18,0.4142857,1,10,50,0.2916667,-1,2,4,17894.97,3,-10,0,0.951,4,-9,4,16754.5,5,-8,8,5.572095,6,9,19,0.1846591,-2,7,46,0.9166667,-3,8,19,0.4833333,-4,-5,2,30.5,-6,-7,24,-1.10582,11,12,30,10.1,-11,-12,10,0.1401754,13,-15,18,0.7638889,-13,-14],[-0.04189,-0.027359,0.013132,0.027553,-0.061059,-0.002908,-0.044853,-0.055169,0.034381,0.025461,-0.00028061,-0.01214,0.02068,0.001722,-0.0054567]],[[18,0.4142857,1,-15,15,-4.732861,2,-14,36,8.1,3,-13,6,28.5,4,-12,26,0.1161667,-1,5,4,14196.17,6,13,36,5.633333,7,12,20,-1.932534,8,-7,38,4.9,9,-6,20,-2.897239,-2,10,40,0.6333333,-3,11,4,7094.168,-4,-5,20,-1.808481,-8,-9,36,7.55,-10,-11],[0.020658,0.0087757,-0.069092,0.010525,-0.045204,0.032413,0.011326,0.02792,-0.036227,-0.075146,0.012015,0.015294,-0.0371,0.020853,-0.00012384]],[[18,0.4142857,1,6,13,0.249118,2,3,0,0.951,-1,-2,44,0.6333333,4,-6,29,0.9,5,-5,26,0.2254167,-3,-4,28,0.3725,7,13,28,0.3516667,8,12,28,0.29125,-7,9,37,2.633333,10,-11,0,0.4721111,-8,11,32,0.8900966,-9,-10,38,4.9,-12,-13,32,0.1376263,-14,-15],[0.00097556,0.033029,-0.059013,0.013335,0.01834,0.033175,-0.00036597,-0.005543,0.019156,-0.026515,0.031255,-0.020905,0.029743,0.021144,0.0026452]],[[18,0.4142857,1,-15,12,0.7486747,-1,2,21,0.0125,3,5,4,8785.94,4,-4,22,0.8086081,-2,-3,14,7851.5,6,7,4,8050.889,-5,-6,35,6.291667,-7,8,19,0.4833333,9,12,24,-1.69497,10,11,21,0.0555,-8,-9,36,5.266667,-10,-11,32,0.6405128,13,-14,5,6.5,-12,-13],[0.020991,-0.011986,0.045725,-0.050733,0.00096514,-0.050788,0.028934,-0.03413,0.025166,0.014596,-0.073436,0.014079,-0.049433,0.029347,-0.00013742]],[[18,0.4142857,-1,1,28,0.29125,-2,2,36,4.291667,3,10,13,0.2330774,-3,4,13,0.2995468,5,7,4,1296.5,-4,6,24,-1.340609,-5,-6,26,0.252125,8,9,13,0.4985146,-7,-8,9,1e-35,-9,-10,34,87.41667,-11,11,17,0.7321429,-12,12,12,1.002199,-13,13,47,0.4642857,-14,-15],[0.0076505,-0.0003701,0.016781,0.017473,-0.049932,0.003659,-0.005876,0.016527,0.0080904,-0.021729,-0.029646,0.025248,0.0015097,-0.035147,0.029158]],[[16,0.4642857,1,3,48,0.55,2,-3,19,0.8660714,-1,-2,20,-0.5541913,4,-15,21,0.2685,5,6,21,0.2565,-4,-5,21,0.276,7,11,21,0.2705,8,9,2,7.5,-6,-7,35,8.633333,-8,10,4,13058.63,-9,-10,21,0.2815,12,13,24,-1.329208,-11,-12,4,17894.97,-13,-14],[-0.014806,0.019008,0.025451,4.7049e-05,0.0079713,-0.058863,-0.0022725,-0.051249,0.0734,-0.058019,0.037995,0.0052613,-0.0014117,0.018111,0.0092141]],[[18,0.4142857,1,-15,12,0.8091519,2,3,20,-2.428901,-1,-2,0,0.951,4,-14,2,22.5,5,9,33,2068.25,6,8,23,6.5,7,-5,0,0.4115556,-3,-4,5,10.5,-6,-7,20,-2.14431,-8,10,30,10.55,11,-13,28,0.2508333,12,-12,0,0.801,13,-11,2,24.5,-9,-10],[-0.031078,0.021454,-0.018547,0.029226,-0.041624,0.031151,-0.019391,0.0085632,-0.066717,-0.0027162,-0.067069,0.021378,0.018467,0.034092,-0.00013048]],[[18,0.4142857,1,2,26,0.2851667,-1,-2,14,208.0,-3,3,42,4.9,4,7,12,1.046522,-4,5,22,0.4220648,-5,6,39,2.125,-6,-7,45,0.8166667,8,-15,12,0.8650316,9,10,35,9.291667,-8,-9,37,1.45,-10,11,14,4078.5,-11,12,24,-1.741919,13,-14,15,-4.1684,-12,-13],[0.0079563,-0.039678,0.01,-0.00032501,0.012115,-0.025183,-0.0070302,-0.0076092,0.0070874,-0.0066199,0.0212,0.040881,0.0057237,-0.0059623,0.0063364]],[[28,0.079,1,2,3,1.5,-1,-2,19,0.5505051,3,6,24,-0.8012106,4,-6,30,12.55,-3,5,30,14.1,-4,-5,30,4.366667,7,8,12,0.5393745,-7,-8,18,0.9444444,9,12,19,0.8660714,10,11,2,43.5,-9,-10,8,4.458374,-11,-12,2,67.5,13,-15,5,2.5,-13,-14],[-2.8141e-05,-0.0047254,-6.7127e-05,-0.033708,-0.0066651,0.0095665,-0.0087635,0.0048373,0.0118,-0.033993,0.043521,0.0018081,-0.048382,-0.00076977,0.032705]],[[28,0.079,-1,1,19,0.5505051,-2,2,6,14.5,3,10,2,19.5,4,7,6,5.5,5,-6,35,6.45,-3,6,32,0.7463492,-4,-5,38,3.875,8,9,38,0.6333333,-7,-8,38,6.45,-9,-10,19,0.8660714,11,13,20,-0.9740914,12,-13,2,45.5,-11,-12,7,1.5,-14,-15],[-0.00080211,-7.1542e-05,0.0027114,-0.053425,0.0034994,0.016398,-0.017338,-0.075325,0.023564,-0.031502,0.0099927,-0.04317,-0.01556,0.0080737,0.032502]],[[42,4.9,1,10,28,0.18875,2,7,15,-6.855403,-1,3,8,1.620342,4,-6,2,17.5,5,6,43,2.416667,-2,-3,6,13.5,-4,-5,12,0.736909,-7,8,24,-1.511471,-8,9,12,1.117603,-9,-10,46,0.775,11,13,10,0.1350676,12,-13,33,8119.75,-11,-12,24,-2.512104,-14,-15],[-0.017007,-0.009948,0.0092231,-0.025757,-0.0037828,-0.00033458,-0.0021622,0.0018338,0.013629,-0.025702,-0.0032202,0.010754,0.0077779,-0.020301,0.011778]],[[13,0.004813819,1,11,39,1.291667,-1,2,9,1.018372,3,-11,24,-1.372948,4,9,26,0.3711667,5,-7,35,6.45,6,7,36,3.416667,-2,-3,40,0.6333333,8,-6,39,5.291667,-4,-5,25,-1.601693,-8,10,16,0.6333333,-9,-10,20,-4.60396,-12,12,16,0.4642857,13,-15,7,2.5,-13,-14],[0.01541,-0.0049504,-0.034901,0.0070647,-0.045096,0.014779,0.016369,-0.040823,-0.010285,0.020399,0.0070991,-0.026213,0.018997,-0.011652,-3.5323e-05]],[[13,0.004813819,-1,1,28,0.3108333,-2,2,8,4.5319,3,-15,12,1.030049,4,13,48,0.2916667,5,11,24,-1.910231,6,-9,28,0.33125,-3,7,13,0.6210801,8,-8,28,0.3616667,-4,9,28,0.3925,-5,10,4,6784.341,-6,-7,12,0.7449379,-10,12,9,1.856929,-11,-12,23,4.5,-13,-14],[0.0043607,-0.00038548,0.018073,-0.026596,0.017352,-0.019641,0.0069228,0.011582,0.011266,-0.034313,0.0091867,-0.033157,0.00077265,-0.043481,0.023518]],[[42,4.9,1,13,28,0.1808333,2,10,15,-6.855403,-1,3,25,-1e-35,4,7,44,0.6333333,-2,5,19,0.6904762,-3,6,7,1.5,-4,-5,10,0.6402247,8,-9,33,3196.25,-6,9,11,1e-35,-7,-8,12,0.736909,-10,11,24,-1.511471,-11,12,12,1.117603,-12,-13,28,0.2055,-14,-15],[-0.015998,0.00019678,-0.0050988,0.0018612,0.023189,-0.010667,-0.011976,0.012967,0.03172,-0.0018277,0.0015647,0.012284,-0.02192,0.0033125,-0.0083332]],[[18,0.4142857,-1,1,28,0.29125,2,4,33,3238.583,3,-4,4,10781.35,-2,-3,7,11.5,5,-15,20,-2.751642,6,8,24,-2.978883,-5,7,6,35.5,-6,-7,18,0.8166667,-8,9,21,0.0505,10,12,4,6251.5,11,-11,42,1.9,-9,-10,9,0.3333333,13,-14,4,1181.5,-12,-13],[0.0065151,-0.00043653,-0.01154,0.001228,0.0048762,-0.019328,0.031094,0.017109,-0.052601,0.0068239,0.0030266,0.032745,0.0084364,-0.00062289,-0.040082]],[[28,0.08366667,1,6,3,1.5,-1,2,32,0.565942,-2,3,5,2.5,-3,4,6,23.5,-4,5,19,0.6904762,-5,-6,19,0.5505051,7,12,5,5.5,8,9,13,0.3794407,-7,-8,11,0.7459685,10,-12,34,26.0,-9,11,34,68.33333,-10,-11,6,5.5,13,-15,34,130.25,-13,-14],[5.1812e-05,-0.00034604,-0.02645,-0.00039292,-0.016237,0.017184,0.003968,-0.0054429,0.022809,-0.015976,-0.002988,0.0059963,0.0036572,-0.018061,0.0090141]],[[27,0.8166667,1,-15,43,0.225,2,4,34,34.5,3,-3,23,2.5,-1,-2,14,8122.0,5,-14,5,4.5,6,7,42,2.380952,-4,-5,34,100.1667,8,10,24,-1.69497,-6,9,4,7751.436,-7,-8,23,8.5,11,-13,36,4.633333,12,-12,32,0.5793288,-9,13,0,0.4452222,-10,-11],[-0.065085,0.017466,0.0068996,-0.0047541,0.021314,-0.023996,0.023368,-0.03197,-0.047695,0.047564,-0.017278,-0.062402,0.0015781,-0.036857,0.00021849]],[[21,0.6695,1,11,21,0.6605,2,7,21,0.6555,3,4,28,0.079,-1,-2,4,854.5,-3,5,20,-0.7413012,6,-6,4,2247.5,-4,-5,20,-1.255793,-7,8,4,3522.1,9,-11,4,1489.5,10,-10,21,0.6675,-8,-9,4,1868.035,12,13,0,0.143,-12,-13,13,0.03126703,-14,-15],[-0.00080437,0.00098009,0.024099,-0.063101,0.011616,0.019857,-0.042031,0.029631,-0.033476,0.031703,-0.037076,-0.0067711,-0.065812,-0.027927,0.019031]],[[25,-2.795847,1,4,19,0.6458333,2,-4,4,1221.936,3,-3,37,1.916667,-1,-2,28,0.079,-5,5,19,0.5505051,-6,6,6,13.5,7,8,2,19.5,-7,-8,19,0.8660714,9,13,20,-1.594864,-9,10,8,3.133687,11,12,35,9.45,-10,-11,7,4.5,-12,-13,7,1.5,-14,-15],[0.0025985,-0.032653,0.0079602,-0.011866,-0.0010945,-0.00017392,0.0045739,-0.015589,0.012295,0.019495,-0.0274,-0.036609,-0.0026724,0.0085785,0.031268]],[[24,-0.5541913,1,3,16,0.55,2,-3,24,-2.38858,-1,-2,4,10464.55,4,9,26,0.6105,5,7,25,-1.552309,-4,6,26,0.133125,-5,-6,4,3753.5,8,-9,26,0.6705,-7,-8,23,7.5,10,12,4,14196.17,11,-12,0,0.851,-10,-11,5,5.5,-13,13,10,0.07013514,-14,-15],[0.036043,-0.0046971,0.00014566,-8.5361e-05,-0.031301,0.024827,0.014449,-0.039518,-0.038378,-0.025066,0.02653,-0.058938,0.044699,0.010744,-0.031779]],[[25,-2.795847,1,4,19,0.6458333,2,-4,4,1221.936,-1,3,5,3.5,-2,-3,28,0.079,-5,5,19,0.5505051,-6,6,20,-0.9562078,7,-15,30,4.366667,8,11,34,645.8333,9,-10,26,0.283125,-7,10,20,-2.751642,-8,-9,19,0.8660714,12,13,32,0.8740079,-11,-12,22,0.5435606,-13,-14],[-0.01162,-0.0027637,0.010782,-0.011044,-0.001077,-0.00017895,-0.00080183,-0.032978,0.022653,0.026805,0.011118,-0.046881,-0.010741,0.034808,-0.0040142]],[[24,-0.5541913,1,5,21,0.2685,-1,2,21,0.276,3,4,21,0.2705,-2,-3,21,0.2975,-4,-5,4,10464.55,6,10,21,0.6105,7,9,21,0.3065,8,-8,20,-0.5250593,-6,-7,14,3756.5,-9,-10,22,0.8297101,11,12,4,14196.17,-11,-12,5,5.5,-13,13,10,0.07013514,-14,-15],[0.00041719,-0.0094739,-0.043514,0.010436,-0.0016225,0.02795,-0.014935,0.022537,0.0016649,-0.045724,-0.012403,-0.057969,0.043773,0.010876,-0.033848]],[[14,208.0,1,2,2,3.5,-1,-2,34,67.16667,3,9,4,1296.5,4,5,20,-2.771769,-3,-4,2,15.5,6,-9,23,2.5,7,8,5,7.5,-5,-6,4,2391.5,-7,-8,4,1114.566,10,12,23,5.5,-10,11,26,0.1115833,-11,-12,32,0.2236111,13,-15,4,1823.5,-13,-14],[-0.027522,0.012372,-0.010372,0.0082637,-0.026972,-0.0056413,0.0077796,-0.025217,0.003554,-0.029614,-0.017531,0.020297,0.03183,0.0084034,0.000191]],[[34,26.0,1,9,4,2453.02,2,6,13,0.2330774,3,4,4,1435.0,-1,-2,25,-1.232457,-3,5,26,0.1161667,-4,-5,26,0.3631667,7,-9,0,0.3673333,-6,8,26,0.121,-7,-8,34,57.25,10,-15,4,1296.5,-10,11,0,0.251,12,-14,4,3642.697,13,-13,26,0.5095,-11,-12],[-0.04474,0.025519,-0.0053958,-0.03061,0.031047,0.037414,0.024309,-0.03334,-0.028637,0.0034127,-0.015216,-0.047202,0.017335,-0.001759,0.00022362]],[[34,26.0,1,3,28,0.05366667,-1,2,11,0.6446022,-2,-3,33,3148.167,-4,4,0,0.509,5,-15,26,0.1321667,6,11,21,0.1275,7,-10,19,0.4833333,8,-9,26,0.121,9,-8,26,0.02125,-5,10,2,8.5,-6,-7,0,0.243,-11,12,2,13.5,13,-14,21,0.0675,-12,-13],[-0.0031566,0.030021,0.0067846,-0.00067576,0.023605,-0.031617,0.0040764,-0.061524,0.016653,0.046441,0.024929,0.0065595,-0.042879,0.00026848,-0.0003585]],[[34,26.0,1,8,4,3522.1,2,7,13,0.2330774,3,4,4,1435.0,-1,-2,25,-0.8224608,-3,5,4,1455.5,-4,6,2,16.5,-5,-6,26,0.121,-7,-8,33,3148.167,9,-15,4,17283.92,10,13,38,5.875,-9,11,13,0.5149842,-10,12,0,0.8663333,-11,-12,7,2.5,-13,-14],[-0.043594,0.026892,-0.00015349,0.035983,-0.003335,0.045203,0.01559,-0.024411,-0.00079055,-0.0049252,0.024585,-0.031484,-0.041445,-0.0047323,0.0012686]],[[34,26.0,1,7,13,0.7122632,2,5,13,0.2330774,3,4,14,1134.5,-1,-2,25,-0.7260951,-3,-4,21,0.3635,-5,6,0,0.2394444,-6,-7,25,-2.795847,-8,8,40,1e-35,9,10,11,0.2614595,-9,-10,50,0.2916667,11,-15,13,0.268487,-11,12,2,10.5,13,-14,13,0.7801795,-12,-13],[-0.04454,0.022939,-0.0014506,0.03083,0.01051,-0.0016767,-0.037889,0.0042376,-0.0050216,0.0013065,0.00011801,-0.038627,0.020262,-0.0065267,0.0013168]],[[32,0.4017544,1,12,0,0.5173333,2,-12,4,2208.5,3,7,19,0.3923077,4,-5,6,4.5,-1,5,24,-1.372948,6,-4,48,0.45,-2,-3,48,0.6333333,8,11,2,4.5,-6,9,32,0.3504386,10,-9,26,0.283125,-7,-8,26,0.0291,-10,-11,4,1296.5,13,-15,35,5.816667,-13,-14],[0.001322,-0.037437,0.0059843,0.0078356,0.0094519,-0.039934,-0.0095047,0.0038699,0.0094701,0.0035472,-0.041448,0.0077147,-0.042206,0.0046098,-0.00020652]],[[27,0.8166667,1,-15,37,0.6333333,2,5,5,5.5,3,4,22,0.1026316,-1,-2,8,5.31755,-3,-4,5,4.5,6,8,12,0.9070055,-5,7,22,0.6602564,-6,-7,37,2.225,9,13,34,160.25,10,-12,32,0.5793288,11,12,24,-1.69497,-8,-9,4,2504.755,-10,-11,36,3.225,-13,-14],[-0.051076,-0.0010751,0.014056,-0.012954,0.0089372,0.0030438,-0.040301,-0.032082,0.0053354,-0.018155,0.039987,-0.04306,-0.0034753,-0.055782,0.00021139]],[[34,26.0,1,5,12,0.7688689,2,4,12,0.2841895,-1,3,28,0.079,-2,-3,14,1134.5,-4,-5,33,3148.167,-6,6,0,0.509,7,10,26,0.1351667,8,9,24,-2.887052,-7,-8,24,-2.442344,-9,-10,12,0.81296,11,-15,21,0.0565,12,-14,0,0.8384444,-11,13,19,0.7321429,-12,-13],[-0.00081341,0.0046353,0.035414,-0.044791,0.021995,-0.00067089,-0.0014011,0.012286,-0.033749,0.0003551,0.0040754,-0.02836,0.012608,0.0052078,-0.0040177]],[[21,0.6695,1,13,21,0.6605,2,12,32,0.4017544,3,9,0,0.5173333,4,7,19,0.3923077,5,-4,6,3.5,-1,6,5,9.5,-2,-3,5,7.5,-5,8,24,-3.3598,-6,-7,21,0.6115,10,11,21,0.5955,-8,-9,0,0.509,-10,-11,20,-1.255793,-12,-13,0,0.123,-14,-15],[-0.00037638,-0.019881,0.005634,0.0033697,0.0030351,0.053232,0.011894,-0.00073048,0.010397,-0.050417,-0.0076127,-0.039875,0.023152,0.0082074,-0.025414]],[[33,3148.167,1,-15,32,0.6802778,-1,2,26,0.26525,3,12,21,0.1395,4,8,21,0.1335,5,-6,34,268.1667,6,7,21,0.1315,-2,-3,13,0.249118,-4,-5,24,-2.094208,-7,9,21,0.2625,10,11,24,-1.582749,-8,-9,7,2.5,-10,-11,26,0.2998333,-12,13,26,0.3095833,-13,-14],[7.8575e-05,-0.0090527,-0.041161,-0.010849,0.011835,0.027662,-0.040071,0.019348,-0.016482,-0.068296,0.014036,0.011755,-0.052593,0.0017663,0.0012946]],[[20,-4.674491,-1,1,16,0.4642857,2,12,48,0.55,3,10,0,0.949,4,6,20,-0.7613364,-2,5,4,11876.75,-3,-4,4,18618.0,-5,7,4,30050.96,-6,8,16,0.3095238,-7,9,15,-4.732861,-8,-9,34,62.63889,-10,11,20,-0.9740914,-11,-12,20,-0.5541913,-13,13,12,0.5525113,-14,-15],[-0.026137,-0.0082766,-0.0092466,-0.044855,0.042313,-0.035601,-0.015778,-0.019332,0.042781,-0.022896,0.049974,-0.0031669,-2.1577e-06,-0.0039105,0.013061]],[[13,0.004813819,1,12,9,0.9729551,2,7,41,0.3095238,3,5,15,-2.566521,-1,4,13,1e-35,-2,-3,43,2.775,6,-6,44,0.7321429,-4,-5,10,0.250641,8,-12,14,1316.5,-7,9,14,1848.5,10,11,34,147.625,-8,-9,34,74.5,-10,-11,11,-0.5345833,13,-15,50,0.3666667,-13,-14],[-0.016781,0.034653,-0.00036517,0.0064039,0.037402,-0.016237,-0.0070895,0.03857,-0.017475,-0.02268,0.014568,-0.0027472,0.0065017,-0.0046605,0.00014731]],[[42,4.9,-1,1,45,0.8166667,2,-15,5,1.5,-2,3,10,0.09011278,4,-14,26,0.2545833,-3,5,4,4812.67,6,9,34,42.08333,7,-7,4,2710.4,8,-6,4,1130.5,-4,-5,23,9.5,10,12,14,2405.5,-8,11,26,0.2691667,-9,-10,30,3.1,-11,13,14,6549.5,-12,-13],[-0.00030804,-0.03578,-0.006698,0.017885,-0.049257,0.031533,0.017828,0.011723,0.0027954,-0.037165,0.0095534,-0.040999,-0.0015726,0.0077643,0.0059892]],[[13,0.004813819,1,6,37,1.916667,2,4,42,1.225,3,-3,15,-6.73891,-1,-2,42,1.775,-4,5,39,6.291667,-5,-6,36,7.55,-7,7,39,9.583333,8,13,21,0.0675,-8,9,13,0.3707457,10,-13,14,3999.5,11,12,13,0.2460538,-9,-10,37,4.291667,-11,-12,24,-2.812466,-14,-15],[-0.025075,0.015077,-0.00069076,-0.011974,-0.010654,0.013227,-0.00067853,0.0039459,-0.031429,-0.0054135,-0.00074717,-0.024724,0.0038544,-0.011894,0.0053683]],[[13,0.004813819,-1,1,37,7.833333,2,3,37,6.583333,-2,-3,26,0.1381667,4,9,4,4188.51,-4,5,24,-2.624343,6,8,26,0.02575,7,-7,24,-3.314148,-5,-6,21,0.0235,-8,-9,26,0.1525833,-10,10,21,0.3635,11,13,28,0.209,12,-13,22,0.902381,-11,-12,4,5601.765,-14,-15],[0.003966,-0.00027679,-0.043981,-0.017297,0.096913,-0.0090157,-0.029763,-0.0088089,0.043882,-0.048904,0.023635,0.0027065,-0.045578,-0.051986,-0.0069869]],[[20,-0.5541913,1,12,25,-2.795847,2,7,19,0.6458333,3,-6,5,4.5,-1,4,2,27.5,-2,5,22,0.8110119,6,-5,0,0.9268889,-3,-4,15,-4.741945,8,-12,25,-0.06352687,9,-11,20,-1.823783,10,11,14,1339.5,-7,-8,10,0.1253272,-9,-10,10,0.06516332,-13,13,19,0.19375,-14,-15],[-0.0014957,0.0067637,0.038946,-0.0046354,-0.00090423,-0.010488,-0.012065,-0.00021524,0.0063702,-0.015343,0.013169,8.2618e-05,0.011327,0.02949,-0.015209]],[[27,0.8166667,1,6,26,0.1411667,2,3,4,14196.17,-1,-2,34,74.5,-3,4,36,3.633333,-4,5,37,1.708333,-5,-6,21,0.0255,7,9,50,0.2361111,8,-9,2,19.5,-7,-8,26,0.03725,10,13,26,0.03125,11,12,4,9953.5,-10,-11,34,128.125,-12,-13,24,-3.3598,-14,-15],[0.00094949,-0.03642,-0.050246,0.022649,-0.0033325,-0.040403,-0.022826,0.0099083,0.011634,0.0075127,-0.043175,-0.0351,-0.0091511,0.015539,3.721e-05]],[[33,3148.167,-1,1,5,7.5,2,4,0,0.243,-2,3,21,0.3635,-3,-4,13,0.3707457,5,10,2,13.5,6,-10,21,0.0825,7,9,24,-2.946133,8,-7,2,10.5,-5,-6,0,0.243,-8,-9,21,0.0885,-11,11,31,0.2916667,12,-15,32,0.9013889,13,-14,14,11441.0,-12,-13],[-0.00051918,0.028779,0.0032397,-0.020675,-0.052715,0.0054139,0.015172,0.008129,-0.041172,-0.0026035,-0.0056609,0.017479,-0.031771,0.042557,0.0013021]],[[37,7.833333,1,2,37,6.708333,-1,-2,4,4188.51,-3,3,26,0.1381667,4,9,24,-2.624343,5,7,26,0.02575,6,-6,24,-3.314148,-4,-5,21,0.0235,-7,8,0,0.341,-8,-9,0,0.5173333,-10,10,12,0.5955612,-11,11,21,0.3635,12,13,25,-0.2940976,-12,-13,0,0.7894444,-14,-15],[-9.8096e-05,-0.043591,-0.032898,0.089146,-0.0096168,-0.029427,-0.0080478,0.002185,0.048242,-0.041697,0.023871,0.013404,-0.017268,-0.048769,0.0028476]],[[33,3148.167,1,3,4,17283.92,-1,2,7,2.5,-2,-3,0,0.509,4,7,31,0.8444444,5,-7,20,-3.43099,-4,6,31,0.45,-5,-6,4,4812.67,8,9,34,180.125,-8,-9,22,0.9607692,10,13,20,-1.852832,11,12,2,49.0,-10,-11,0,0.825,-12,-13,7,9.5,-14,-15],[-0.00035605,-0.040695,-0.0050221,0.019843,0.0007724,-0.022993,0.0098753,0.01306,-0.030208,0.0077788,-0.038205,-0.0050884,0.0043179,-0.0053047,-0.067619]],[[33,3148.167,1,3,4,17283.92,-1,2,7,2.5,-2,-3,2,4.5,-4,4,4,4744.56,5,7,34,343.0,6,-7,26,0.1995833,-5,-6,2,7.5,-8,8,29,0.2916667,-9,9,10,0.1801163,10,-15,31,0.8444444,11,13,49,0.4166667,12,-12,8,2.022332,-10,-11,2,18.5,-13,-14],[-0.0003575,-0.04044,-0.0050602,0.02925,-0.0082444,0.018291,-0.031328,-0.038222,0.0058981,-0.021447,0.00263,-0.036454,0.020621,0.0026824,-0.0042208]],[[33,3148.167,1,3,4,17283.92,-1,2,7,2.5,-2,-3,5,7.5,4,12,0,0.243,-4,5,4,4812.67,6,7,35,7.875,-5,-6,35,9.291667,-7,8,6,22.5,9,11,24,-2.577374,10,-10,5,3.5,-8,-9,24,-1.329208,-11,-12,4,7184.797,13,-15,2,4.5,-13,-14],[-0.00036394,-0.03984,-0.005189,0.02642,0.01148,-0.030758,0.00029214,-0.0065007,0.014001,0.017476,-0.016758,0.006956,0.032685,-0.011273,0.00078981]],[[33,3148.167,1,3,4,17283.92,-1,2,6,41.5,-2,-3,5,7.5,4,12,2,20.5,5,6,26,0.2691667,-4,-5,26,0.2425833,7,10,4,5221.5,-6,8,19,0.775,9,-9,20,-3.349983,-7,-8,20,-1.763523,11,-12,4,5782.165,-10,-11,4,7184.797,13,-15,2,4.5,-13,-14],[-0.00037774,-0.030567,0.0038795,0.0099291,-0.011792,-0.030971,0.021844,-0.0058535,0.013476,-0.011943,0.022255,0.00077376,0.031225,-0.010823,0.00075629]],[[42,4.9,1,-15,12,1.146166,2,13,28,0.1808333,3,8,15,-6.993293,-1,4,8,1.620342,5,-6,43,2.291667,6,7,20,-0.7179443,-2,-3,2,14.5,-4,-5,5,5.5,9,-12,12,0.6479745,10,11,5,3.5,-7,-8,20,-2.189015,-9,12,28,0.2558333,-10,-11,0,0.9278889,-13,-14],[-0.016554,-0.017662,0.0092967,0.012774,-0.0095183,-0.00016565,0.001914,-0.018624,0.0004063,0.0070382,0.020824,-0.0012384,-0.011507,0.022852,0.0021855]],[[18,0.4142857,1,-15,4,17894.97,2,-14,0,0.951,3,-13,4,16754.5,4,-12,8,5.572095,5,8,38,3.583333,-1,6,6,27.5,7,-4,9,2.451681,-2,-3,38,4.291667,9,-11,5,3.5,10,13,28,0.1352778,-5,11,36,4.366667,12,-8,4,3886.796,-6,-7,11,1e-35,-9,-10],[0.010371,-0.067633,0.012762,0.028477,-0.032868,0.0096698,-0.048502,0.0223,-0.05787,0.0041695,0.023947,-0.045946,0.033151,0.023269,-0.00011273]],[[33,3148.167,1,10,4,17283.92,2,9,35,8.9,-1,3,2,7.5,-2,4,4,2087.5,5,6,0,0.363,-3,-4,2,14.5,7,-8,7,3.5,8,-7,24,-3.180628,-5,-6,7,2.5,-9,-10,0,0.509,11,-15,1,340.0,12,13,5,9.5,-11,-12,36,3.775,-13,-14],[-9.4998e-05,-0.043509,0.040506,0.00078435,0.0053581,-0.041663,0.028366,-0.00042908,-0.038682,-0.0047236,-0.0007603,-0.058525,-0.023971,0.0066006,-0.00022873]],[[18,0.4142857,1,-15,0,0.7268889,2,11,28,0.2255,3,10,2,28.5,4,9,20,-2.569387,5,7,6,5.5,6,-3,32,0.4714052,-1,-2,6,5.5,-4,8,6,43.5,-5,-6,5,3.5,-7,-8,19,0.6458333,-9,-10,32,0.8699678,12,-14,34,415.5,13,-13,34,363.1667,-11,-12],[-0.03166,0.027207,-0.057447,-0.021223,0.01681,-0.032294,0.013989,-0.057036,-0.04663,0.012341,0.012933,-0.048314,0.03141,-0.034829,-0.00011358]],[[33,3148.167,-1,1,0,0.509,2,6,21,0.1355,-2,3,0,0.243,-3,4,2,13.5,5,-6,20,-1.634161,-4,-5,13,0.2297853,-7,7,21,0.0955,8,11,19,0.7321429,9,10,0,0.8894444,-8,-9,2,26.5,-10,-11,24,-1.837707,-12,12,6,5.5,13,-15,36,9.55,-13,-14],[-0.00052559,0.0068315,0.020063,-0.061063,-0.00106,-0.0016962,-0.0031643,-0.00024762,-0.026797,-0.031414,0.023532,0.015988,-0.032215,0.0049841,0.0052032]],[[18,0.4142857,1,2,26,0.2851667,-1,-2,9,2.875277,3,7,8,4.120181,-3,4,25,-0.06352687,-4,5,10,0.7506477,-5,6,5,7.5,-6,-7,38,0.775,8,10,25,-1.572726,-8,9,20,-0.9195743,-9,-10,21,1e-35,-11,11,4,1868.035,12,13,4,1823.5,-12,-13,4,1878.5,-14,-15],[0.0076665,-0.037507,0.00035866,-0.0046564,0.0041503,0.006194,0.049372,0.0023621,-0.0078411,0.030401,-0.014816,0.023299,0.09195,-0.042013,0.011165]],[[18,0.4142857,1,-15,19,0.5669643,2,11,36,6.928571,3,9,33,2582.167,4,7,19,0.4365079,5,6,30,7.1,-1,-2,26,0.191125,-3,-4,6,44.5,-5,8,26,0.07425,-6,-7,26,0.234125,-8,10,4,13834.58,-9,-10,21,0.1445,12,-14,37,0.9444444,13,-13,7,3.5,-11,-12],[-0.00979,0.031793,-0.056816,0.002139,0.023064,0.022163,-0.062428,-0.049327,-0.029529,0.034723,-0.054598,0.012011,0.025214,-0.032082,-0.0001117]],[[33,3148.167,1,3,4,17283.92,-1,2,6,41.5,-2,-3,0,0.509,4,9,26,0.02125,-4,5,31,0.8444444,-5,6,36,3.775,-6,7,21,0.1095,8,-9,24,-2.068442,-7,-8,12,0.81296,10,11,40,0.7321429,-10,-11,24,-1.07673,-12,12,21,0.3025,-13,13,24,-0.5541913,-14,-15],[-0.00037283,-0.029587,0.0044378,0.020698,-0.0008487,-0.03027,-0.01993,0.017067,0.0015302,-0.0025733,0.0057364,-0.00568,0.013483,-0.019633,0.013152]],[[18,0.4142857,-1,1,24,-1.10582,2,4,30,10.1,-2,3,19,0.3484848,-3,-4,10,0.1401754,5,-15,18,0.7638889,-5,6,6,5.5,7,-14,0,0.407,8,10,5,9.5,9,-8,4,4506.0,-6,-7,4,1868.035,-9,11,4,3522.1,-10,12,0,0.657,-11,13,36,7.875,-12,-13],[0.0066509,-0.00025541,-0.027176,-0.0031541,0.019803,0.0098208,-0.019496,-0.010085,-0.049465,0.0051368,-0.012014,-0.076628,-0.017347,0.0050716,-0.0054529]],[[21,0.6715,1,13,21,0.6605,2,9,21,0.4295,3,-8,21,0.3455,4,-7,21,0.2985,5,8,21,0.2855,6,-4,21,0.2825,7,-3,21,0.276,-1,-2,5,10.5,-5,-6,4,1296.5,-9,10,20,-1.172939,11,12,4,1878.5,-10,-11,4,3522.1,-12,-13,4,1878.5,-14,-15],[-0.00025401,0.014995,-0.035102,0.012806,-0.0077749,-0.064081,0.0077154,-0.0026992,-0.045153,-0.056619,0.016694,0.026883,-0.037553,-0.052111,0.0039179]],[[33,3148.167,1,9,4,17283.92,2,8,32,0.8402899,-1,3,4,5928.0,4,-7,4,2782.5,5,-6,21,0.0545,6,7,21,0.0475,-2,-3,6,1e-35,-4,-5,4,23437.36,-8,-9,0,0.509,10,-15,31,0.8444444,11,13,26,0.02575,-10,12,37,9.5,-11,-12,36,3.775,-13,-14],[-0.00017134,-0.029944,0.060652,-0.059429,0.004588,-0.028148,0.0083622,-0.031459,0.0015553,0.021665,-0.0002256,-0.048507,-0.029454,0.0103,-0.00023308]],[[13,0.004813819,1,-15,44,0.7321429,2,12,2,15.5,3,10,33,1032.167,4,5,34,83.41667,-1,-2,36,5.414286,6,8,26,0.2405833,7,-5,25,-0.2154535,-3,-4,9,1.185297,-6,9,33,2604.167,-7,-8,24,-3.043395,-9,11,19,0.2613636,-10,-11,22,0.7958333,13,-14,11,-0.7550033,-12,-13],[0.0013233,-0.040829,0.025441,-0.0023337,0.0032859,-0.016791,-0.011496,0.022932,0.024462,-0.027406,-0.0023675,-0.014196,0.014395,0.023587,-0.00016648]],[[18,0.4142857,1,-15,0,0.7268889,2,-14,21,0.0835,3,8,21,0.0705,4,7,24,-1.974683,-1,5,20,-2.189015,6,-4,32,0.5727513,-2,-3,30,3.9,-5,-6,20,-1.872303,9,13,24,-1.709527,10,12,32,0.3689931,-7,11,34,195.25,-8,-9,24,-1.511471,-10,-11,30,4.875,-12,-13],[-0.039841,0.03541,-0.024211,-0.0070744,0.046169,-0.0077077,-0.034691,0.050586,-0.0077741,-0.06882,0.0025175,-0.030354,0.025862,0.012489,-0.00011354]],[[16,0.4642857,1,4,48,0.55,2,3,0,0.949,-1,-2,44,1e-35,-3,-4,20,-0.5541913,5,-15,21,0.2685,6,7,21,0.2565,-5,-6,21,0.276,8,11,21,0.2705,9,10,2,7.5,-7,-8,34,270.1667,-9,-10,21,0.2815,-11,12,4,4972.0,-12,13,4,17894.97,-13,-14],[-0.016068,0.011814,0.046922,-0.00481,3.4429e-05,0.0074308,-0.056279,-0.0018229,-0.049916,0.00063426,0.018552,0.0017974,-0.0092966,0.016261,0.0082127]],[[18,0.4142857,-1,1,9,2.875277,2,9,8,4.120181,-2,3,25,-0.124227,4,5,38,8.708333,-3,-4,10,0.8005102,6,-9,32,0.3689931,-5,7,24,-1.774205,8,-8,26,0.105125,-6,-7,38,0.775,10,12,2,14.5,11,-12,20,-1.988885,-10,-11,30,1.416667,13,-15,20,-3.967576,-13,-14],[0.0066352,0.00035216,-0.0054403,0.01513,0.012654,-0.014554,0.01401,-0.014398,0.025447,-0.0090085,0.00091494,0.0045675,-0.022327,0.017301,-0.0041558]],[[18,0.4142857,1,12,9,1.931197,2,8,4,17894.97,3,-7,7,1.5,4,6,49,0.2916667,5,-3,2,13.5,-1,-2,46,0.775,7,-6,4,16754.5,-4,-5,25,-0.3233965,-8,9,7,7.5,10,11,26,0.1301667,-9,-10,41,0.6333333,-11,-12,14,208.0,13,-15,2,3.5,-13,-14],[0.018827,-0.050549,0.0089995,0.0057314,-0.038313,-0.036968,0.023267,-0.014961,-0.014626,0.034346,-0.046529,0.02132,-0.026513,0.011417,-0.00018792]],[[18,0.4142857,1,-15,24,-1.974683,-1,2,7,5.5,3,9,20,-1.911444,4,7,36,5.633333,5,-5,36,4.916667,-2,6,24,-1.741919,-3,-4,20,-1.823783,-6,8,22,0.9110672,-7,-8,30,2.55,10,11,26,0.1251667,-9,-10,0,0.8557778,12,13,0,0.7268889,-11,-12,6,36.5,-13,-14],[-0.011061,0.022417,0.011376,-0.060925,0.039107,-0.06164,0.021737,-0.027082,0.010016,-0.061853,-0.0035483,0.02208,0.016671,-0.06591,-0.00010992]],[[18,0.4142857,1,-15,21,0.0135,2,4,24,-1.741919,-1,3,24,-1.489191,-2,-3,4,8785.94,5,9,4,8465.425,6,-8,26,0.1161667,-4,7,26,0.180125,-5,8,0,0.373,-6,-7,19,0.3038462,10,13,26,0.2545833,11,-12,22,0.8248082,-9,12,26,0.1161667,-10,-11,12,1.030049,-13,-14],[0.018985,-0.061355,0.013748,0.023326,-0.021127,-0.024399,0.021552,-0.061869,0.012121,0.0086789,-0.060318,0.026739,0.018994,-0.026849,-0.00011584]],[[18,0.4142857,-1,1,9,2.875277,2,4,10,0.2601775,-2,3,20,-1.726858,-3,-4,38,0.775,5,13,2,14.5,6,11,11,0.2614595,7,9,33,1808.25,8,-7,0,0.1836667,-5,-6,4,1951.0,-8,10,37,1.291667,-9,-10,6,8.5,-11,12,24,-2.118915,-12,-13,14,1486.5,-14,-15],[0.0071455,0.00023209,-0.00049038,-0.0093662,-0.030783,-0.0079791,0.0010314,0.0094833,-0.022332,0.0015038,0.011745,-0.011083,0.0037016,0.019484,0.0035243]],[[21,0.6695,1,10,21,0.6605,2,6,21,0.4295,3,-5,21,0.3455,4,-4,21,0.2985,5,-3,21,0.2855,-1,-2,20,-1.255793,-6,7,4,3522.1,8,-10,4,1489.5,9,-9,21,0.6675,-7,-8,4,1868.035,11,13,4,1315.5,12,-13,4,1296.5,-11,-12,3,1.5,-14,-15],[-0.00014832,0.012265,-0.011248,0.0073015,-0.0025712,-0.038861,0.027966,-0.032894,0.029545,-0.037516,-0.034777,0.049842,-0.051834,0.016059,-0.032921]],[[18,0.4142857,-1,1,32,0.4017544,2,11,2,25.5,-2,3,24,-1.068109,4,10,4,2992.525,-3,5,4,16754.5,6,-9,35,3.9,7,8,32,0.3421637,-4,-5,26,0.090125,-6,9,26,0.283125,-7,-8,35,3.9,-10,-11,4,1296.5,12,13,35,5.816667,-12,-13,30,1e-35,-14,-15],[0.0064285,7.4698e-05,-0.003256,0.017878,-0.036153,0.055537,0.006589,0.050229,-0.024416,0.0070285,-0.057286,-0.040988,0.00362,0.0015795,-0.0017715]],[[18,0.4142857,-1,1,20,-0.5541913,2,12,30,10.1,3,7,30,8.416667,-2,4,13,0.5230117,5,-6,3,2.5,-3,6,20,-2.030779,-4,-5,19,0.775,8,-12,38,4.9,9,-11,34,74.5,-7,10,30,23.125,11,-10,19,0.5916667,-8,-9,10,0.06516332,-13,13,19,0.19375,-14,-15],[0.0059728,-0.00026743,-0.0068514,0.045843,0.0071237,0.030141,-0.026827,-0.0015135,-0.025337,0.016999,-0.022889,0.022393,0.010684,0.02741,-0.014414]],[[28,0.08366667,1,-15,9,2.875277,2,11,40,0.775,3,6,37,2.585714,4,5,10,0.2300794,-1,-2,11,0.2168751,-3,-4,50,0.4142857,7,8,23,5.5,-5,-6,2,7.5,9,-10,13,0.2297853,10,-9,12,1.000005,-7,-8,37,0.2916667,-11,12,4,1695.5,-12,13,37,1.1,-13,-14],[0.00050869,-0.007263,-0.022644,8.803e-05,-0.0042428,-0.029354,0.020893,-0.0073094,-0.0042603,1.6064e-05,0.0075834,-0.017381,-0.012552,0.0054113,0.00094865]],[[33,3148.167,1,-15,4,10781.35,2,9,34,358.25,3,8,38,5.875,-1,4,4,4744.56,5,-6,26,0.1231667,6,-5,26,0.118125,7,-4,2,7.5,-2,-3,12,0.7449379,-7,-8,32,0.5566239,10,12,6,10.5,11,-11,34,101.25,-9,-10,34,268.1667,13,-14,6,47.5,-12,-13],[-0.00024695,-0.032104,0.0053675,0.04543,-0.041032,0.02416,0.0016946,-0.025372,-0.045376,-0.0033917,0.0035301,-0.036555,0.0051228,0.0088155,0.0012527]],[[23,9.5,1,7,4,6201.5,-1,2,34,282.75,3,-7,5,6.5,4,-6,6,21.5,5,-5,14,4710.5,6,-4,5,1.5,-2,-3,4,4188.51,8,9,30,0.7083333,-8,-9,5,8.5,10,11,6,22.5,-10,-11,2,11.5,12,-15,26,0.02125,13,-14,26,0.01625,-12,-13],[0.00039348,-0.0055163,-0.034476,-0.0081169,-0.002615,-0.0012507,0.0026269,-0.054273,-0.0093566,0.0078892,-0.0015319,-0.025211,0.045309,-0.061904,-0.00033105]],[[24,-1.21694,1,9,21,0.559,2,8,21,0.5235,3,-7,8,1.839999,4,-6,43,4.45,-1,5,7,1e-35,-2,6,19,0.1380952,7,-5,6,4.5,-3,-4,21,0.6555,-8,-9,10,0.1401754,10,-15,6,22.5,11,-14,2,22.5,12,13,13,0.2167035,-10,-11,6,4.5,-12,-13],[-0.013741,0.011719,-0.010789,-0.063029,0.0018709,-0.00015345,-0.051078,0.018057,-0.03207,0.0083321,-0.00073692,-0.046383,-0.0056969,0.010409,-0.0039858]],[[20,-4.674491,-1,1,25,-2.971001,-2,2,9,5.510233,3,-15,24,-3.42841,4,-14,4,1455.5,5,10,22,0.07549858,6,8,20,-3.611604,7,-5,5,5.5,-3,-4,5,9.5,9,-8,5,1.5,-6,-7,6,9.5,11,13,0,0.149,12,-11,4,1840.5,-9,-10,2,19.5,-12,-13],[-0.025255,0.0043302,0.033227,-0.010721,-0.028073,0.010326,-0.035765,0.00094993,0.02814,-0.027198,0.023791,-0.041052,-9.0407e-06,-0.00022169,-0.024678]],[[42,4.9,-1,1,46,0.775,2,12,26,0.2425833,3,7,10,0.06516332,-2,4,30,8.416667,5,6,30,4.708333,-3,-4,30,14.55,-5,-6,12,0.2159427,-7,8,0,0.8221111,9,-12,12,0.6977059,-8,10,7,2.5,-9,11,28,0.1029167,-10,-11,24,-2.512104,-13,13,45,0.3666667,-14,-15],[-0.00029649,-0.0081069,0.0033949,-0.020666,0.034227,-0.021255,0.026822,-0.010063,0.010776,-0.027791,0.0022418,0.010813,-0.018914,-0.0067981,0.014776]],[[42,4.9,-1,1,46,0.775,2,-15,26,0.2425833,3,8,30,7.1,4,7,30,5.125,5,-5,12,0.9807172,6,-4,38,3.875,-2,-3,30,14.55,-6,-7,12,0.2159427,-8,9,0,0.8221111,10,-14,13,0.3038161,11,-13,7,2.5,12,13,44,0.4142857,-9,-10,28,0.1029167,-11,-12],[-0.00031882,-0.0078712,0.0043364,0.0090798,-0.033463,0.021207,-0.02416,0.025811,0.013677,-0.014709,-0.025937,0.0020829,-0.0099456,0.010631,0.0093503]],[[42,4.9,1,8,12,1.146166,2,7,28,0.18875,-1,3,13,0.249118,4,6,24,-1.180848,5,-4,7,11.5,-2,-3,0,0.621,-5,-6,0,0.9278889,-7,-8,46,0.775,9,12,6,44.5,10,-12,11,0.6446022,-9,11,4,7859.55,-10,-11,24,-2.512104,-13,13,16,0.3666667,-14,-15],[-0.00062403,0.0033419,-0.028187,0.01829,-0.0054583,0.0057266,-0.011269,0.021035,-0.001069,0.014631,-0.0081002,0.012362,-0.018765,-0.021093,0.012129]],[[28,0.08366667,1,7,3,1.5,-1,2,10,0.195061,3,5,5,4.5,4,-4,21,0.2145,-2,-3,19,0.1519231,6,-7,25,-0.1666667,-5,-6,19,0.5505051,8,10,5,5.5,9,-10,13,0.3794407,-8,-9,25,-1.086651,-11,11,20,-0.9195743,12,-15,29,0.9,13,-14,12,0.7328118,-12,-13],[6.8258e-05,0.00091537,-0.029124,0.0057149,0.0014483,0.039746,-0.010946,0.0034275,-0.0043851,-0.002224,-0.026326,-0.0092908,0.0056462,0.011557,-0.0041938]],[[42,4.9,1,11,12,1.038223,2,8,34,165.6667,3,6,34,150.1667,-1,4,26,0.05425,-2,5,26,0.061125,-3,-4,26,0.4555,7,-7,21,0.4345,-5,-6,32,0.4183333,-8,9,5,5.5,-9,10,8,1.839999,-10,-11,46,0.775,-12,12,45,0.3666667,-13,13,15,-2.809476,-14,-15],[-0.00035638,0.012331,-0.04647,-0.0080692,0.0010197,0.027905,-0.035398,0.0089943,-0.019102,-0.038277,-0.0010987,0.0011292,-0.008407,0.0033828,0.018166]],[[42,4.9,-1,1,28,0.2055,2,13,37,2.291667,3,5,11,0.6446022,4,-4,2,18.5,-2,-3,14,2960.5,6,8,32,0.3643579,7,-7,19,0.19375,-5,-6,23,9.5,-8,9,2,16.5,10,11,22,0.7752525,-9,-10,24,-1.774205,12,-13,24,-2.577374,-11,-12,21,0.2705,-14,-15],[-0.00032558,-0.0080801,0.0031209,0.010313,-0.029508,0.012442,0.019422,-0.0034827,0.023806,-0.038734,-0.01544,0.030412,0.0052042,-0.00053923,-0.055603]],[[33,206.6667,1,2,12,0.6264855,-1,-2,16,0.2678571,3,5,19,0.3923077,-3,4,35,1.944444,-4,-5,24,-0.5541913,6,8,21,0.1385,7,-8,37,7.833333,-6,-7,21,0.6105,9,12,37,3.875,10,-12,4,10464.55,-9,11,23,9.5,-10,-11,4,3753.5,13,-15,7,2.5,-13,-14],[0.0048853,0.034183,0.030277,0.022071,-0.030303,0.00043376,0.021468,-0.0010937,0.011591,-0.036512,0.0063087,0.023147,-0.015102,0.026454,-0.038378]],[[42,4.9,1,11,8,1.620342,2,-11,2,15.5,3,9,43,3.633333,4,-7,29,0.4166667,5,-6,24,-1.205914,6,7,4,1385.5,-1,-2,20,-1.08647,-3,8,0,0.149,-4,-5,23,6.5,10,-10,24,-1.758393,-8,-9,48,0.2916667,-12,12,21,0.0325,-13,13,4,2336.5,-14,-15],[-0.0017964,-0.035695,0.019642,0.014121,-0.024335,0.0036094,0.013634,-0.069996,-0.015043,-0.0033305,-7.946e-05,0.0028228,0.0046408,0.0058004,-0.044345]],[[42,4.9,-1,1,46,0.775,2,11,6,44.5,3,-11,11,0.6446022,4,10,48,0.6333333,5,9,1,340.0,-2,6,30,4.875,7,8,13,0.5107791,-3,-4,6,37.5,-5,-6,25,-1.434537,-7,-8,4,6422.408,-9,-10,45,0.3666667,-12,12,9,1.490948,13,-15,16,0.3666667,-13,-14],[-0.00031698,-0.0062048,0.0055389,-0.01198,-0.010775,0.011869,0.011304,-0.03005,0.015836,-0.0050787,0.011947,-0.0077033,-0.026847,0.01952,0.00091752]],[[42,4.9,-1,1,28,0.2055,2,13,26,0.2721667,3,11,21,0.2695,4,-10,20,-0.7613364,5,-9,30,7.1,6,8,30,5.125,-2,7,21,0.2455,-3,-4,32,0.7785948,9,-8,30,11.1,-5,10,19,0.6458333,-6,-7,0,0.8278889,12,-13,16,0.9,-11,-12,21,0.2705,-14,-15],[-0.00031179,0.0017526,-0.025063,0.0089263,0.027151,-0.014875,0.025718,-0.016981,-0.016944,-0.04136,-0.019058,0.0058037,0.014859,-0.00068127,-0.054486]],[[42,4.9,1,-15,12,1.038223,2,6,12,0.2884244,3,-5,5,7.5,4,-4,35,2.9,-1,5,33,866.25,-2,-3,22,0.4220648,-6,7,39,2.125,8,9,0,0.825,-7,-8,5,5.5,10,12,13,0.09902027,11,-11,28,0.1055,-9,-10,22,0.4686275,13,-14,9,2.128237,-12,-13],[-0.022096,0.0073256,-0.014355,0.0027304,0.00025718,0.011333,-0.028996,0.0097743,-0.014975,0.0083831,-0.021375,-0.041719,0.0086713,0.0047187,0.002195]],[[13,0.004813819,1,-15,41,0.3095238,2,4,39,8.45,3,-3,5,10.5,-1,-2,37,1.916667,5,11,44,0.7321429,6,-10,0,0.307,-4,7,4,7094.168,8,9,15,-6.119419,-5,-6,6,9.5,10,-9,20,-2.052514,-7,-8,0,0.4721111,-11,12,15,-3.926618,13,-14,21,0.0525,-12,-13],[-0.01464,0.02548,0.0044607,0.0204,-0.026363,0.013905,-0.076777,0.0005414,0.0081993,0.030911,-0.015778,-0.021065,0.032718,-0.017847,-0.00016094]],[[42,4.9,-1,1,46,0.775,2,13,10,0.1350676,3,-13,26,0.2425833,4,12,21,0.2185,5,11,21,0.2075,6,-8,36,4.916667,7,9,39,9.833333,-2,8,14,1906.5,-3,-4,26,0.1885833,-5,10,25,-0.3566346,-6,-7,30,7.416667,-9,-10,12,0.322117,-11,-12,24,-2.512104,-14,-15],[-0.0002913,-0.031556,0.0047609,-0.013887,0.002111,0.020985,-0.039661,0.019868,-0.044654,0.0075395,0.018946,0.00061042,0.0060954,-0.017885,0.0099313]],[[13,0.004813819,1,-15,41,0.3095238,2,12,12,0.9979325,3,5,39,7.775,-1,4,28,0.2536667,-2,-3,16,0.6333333,-4,6,24,-1.302947,7,-11,2,11.5,8,9,34,65.25,-5,-6,35,8.225,10,-10,34,112.75,-7,11,14,5788.5,-8,-9,37,1.916667,-12,13,0,0.4721111,-13,-14],[-0.013977,0.017752,-0.033909,-0.023167,-0.018716,0.0094285,0.0029716,-0.053388,-0.015022,0.010546,0.012674,0.013006,-0.01482,0.013653,-0.00017077]],[[42,4.9,-1,1,46,0.775,2,10,10,0.06516332,3,8,33,8119.75,4,-7,0,0.569,5,-6,42,5.291667,6,-5,12,0.8650316,7,-4,12,0.3558258,-2,-3,30,8.416667,-8,9,20,-1.491147,-9,-10,45,0.3666667,-11,11,9,1.465028,12,-15,16,0.3666667,-12,13,9,0.2027326,-13,-14],[-0.0002968,0.01734,-0.0060993,0.0103,-0.020207,-0.0086967,0.0093249,0.0024328,0.025475,-0.0019661,-0.0073854,-0.025399,0.0046763,0.023803,0.0008184]],[[42,4.9,-1,1,46,0.775,2,-15,8,2.863221,3,-14,33,8119.75,4,12,0,0.509,5,8,11,-1.628678,-2,6,13,0.1622088,7,-5,15,-2.03111,-3,-4,4,3190.5,9,10,5,8.5,-6,-7,36,7.291667,11,-10,43,6.8375,-8,-9,0,0.8384444,13,-13,32,0.8854895,-11,-12],[-0.0002918,-0.028797,0.00085959,0.02427,-0.0027887,0.016161,-0.021383,-0.010791,-0.029771,-0.004094,-0.030455,0.0081267,0.018281,0.0041663,0.0075096]],[[28,0.079,1,4,26,0.03016667,2,-4,0,0.501,3,-3,0,0.213,-1,-2,19,0.5505051,5,13,24,-1.038218,6,8,4,1795.597,7,-7,36,1.416667,-5,-6,0,0.3268889,-8,9,32,0.5026316,10,-13,21,0.1435,11,12,46,0.3095238,-9,-10,4,3190.5,-11,-12,21,0.6535,-14,-15],[-0.0023372,0.018065,-0.0054357,-0.0012308,0.018669,0.0020331,-0.001753,0.018429,-0.0040639,0.038959,0.0089686,-0.021442,0.0070371,0.0047898,-0.039166]],[[27,0.8166667,1,-15,37,0.3666667,2,5,5,5.5,3,4,22,0.1026316,-1,-2,6,1e-35,-3,-4,1,340.0,6,11,20,-1.289065,7,-10,24,-1.470294,8,-9,20,-1.932534,9,-8,20,-2.788822,10,-7,39,6.944444,-5,-6,22,0.2649123,12,13,24,-2.210432,-11,-12,22,0.3480769,-13,-14],[-0.05053,-0.0016297,-0.013986,0.014128,-0.015674,0.0297,0.06714,-0.016272,0.04913,-0.033495,-0.025853,0.036131,-0.050805,-0.01394,0.00019826]],[[20,-4.674491,-1,1,21,0.6715,2,13,21,0.6605,3,11,21,0.4295,4,-10,21,0.3455,5,-9,21,0.2985,6,10,21,0.2855,7,-6,21,0.2825,8,-5,21,0.276,9,-4,21,0.2705,-2,-3,5,10.5,-7,-8,20,-1.172939,12,-13,33,1882.167,-11,-12,12,0.9692722,-14,-15],[-0.024816,0.00027391,-0.038855,0.014133,-0.033087,0.012027,-0.0066592,-0.060698,0.0070055,-0.0025543,-0.045798,0.013369,0.018013,0.00027536,-0.051781]],[[13,0.004813819,1,-15,36,9.55,2,-14,33,1193.25,3,5,47,0.4642857,4,-3,11,-0.7550033,-1,-2,39,1.291667,-4,6,24,-1.315304,7,11,14,2120.5,8,10,37,2.928571,9,-7,8,2.540535,-5,-6,22,0.4142157,-8,-9,18,0.6333333,-10,12,33,1888.25,-11,13,4,14196.17,-12,-13],[-0.037491,0.0089759,0.003827,0.019725,-0.0010846,0.032733,-0.029019,-0.032444,-0.001314,0.025205,-0.021377,0.017312,-0.018634,-0.013823,-0.00016085]],[[42,4.9,-1,1,12,0.9837347,2,11,48,0.2916667,3,9,23,9.5,4,5,14,2960.5,-2,-3,2,15.5,6,8,13,0.2995468,7,-6,32,0.7613872,-4,-5,39,7.225,-7,-8,21,0.0305,-9,10,39,6.45,-10,-11,38,1.291667,12,13,16,0.7083333,-12,-13,10,0.1253272,-14,-15],[-0.00029143,0.0029933,-0.0055686,0.009437,-0.050916,0.020713,-0.0043741,0.0091396,0.0051836,-0.0065044,-0.056609,-0.0045222,0.014711,-0.015145,0.014555]],[[18,0.4142857,-1,1,24,-1.21694,2,7,21,0.559,3,6,21,0.5235,4,-5,30,10.1,5,-4,30,8.416667,-2,-3,21,0.6555,-6,-7,21,0.4305,8,11,16,0.2678571,-8,9,22,0.3900966,-9,10,34,68.33333,-10,-11,14,1833.5,-12,12,5,9.5,13,-15,11,0.8634694,-13,-14],[0.0056151,-0.00072104,0.014251,-0.012186,-0.048986,0.016958,-0.030933,-0.027039,0.010462,-0.039814,0.0021897,-0.012477,0.0072142,-0.025433,-0.016394]],[[42,4.9,1,-15,28,0.18875,2,5,15,-6.855403,-1,3,8,1.243645,4,-4,2,19.5,-2,-3,5,5.5,6,13,11,0.6446022,7,10,20,-2.189015,-5,8,12,0.6658537,-6,9,28,0.2558333,-7,-8,0,0.4105556,11,-12,23,4.5,-9,12,11,1.605888,-10,-11,14,14983.5,-13,-14],[-0.015751,-0.0027431,-0.019873,-0.0003352,0.00025841,-0.0016344,0.007096,0.021214,-0.0077586,-0.057652,0.012385,0.0038291,-0.0023991,0.019881,0.0019655]],[[13,0.004813819,1,-15,44,0.7321429,2,13,2,15.5,3,10,33,882.25,-1,4,36,5.414286,5,7,42,1.45,6,-4,37,1.291667,-2,-3,4,5221.5,8,9,20,-2.123484,-5,-6,36,6.928571,-7,-8,0,0.421,11,12,35,6.633333,-9,-10,50,0.6333333,-11,-12,37,0.9444444,-13,-14],[-0.010803,0.027612,0.0059107,0.0026197,-0.03179,0.0031834,-0.021278,0.023173,-0.038979,-0.00075232,0.010219,-0.0090426,0.024291,0.0040871,-0.0001554]]]},
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
			"getRaceFocus", "getBuildPriors", "estimateBuilds", "getOptionStats", "getBuildFeatures", "getRankerScore", "getShipRole", "getListedShare", "setConfidence", "getMineChange", "estimateTorpedoUse", "getLikelyTorpedoes",
			"getKnownShips", "getSeenTurns", "estimateStarbaseItems", "estimateStarbaseBuilds", "getLoadedAmmo", "estimateTorpedoRecent", "estimateTorpedoPrior"],
		//how often the build estimate was right on complete games, from tools/report.js: model version and its hash
		//(getModelVersion, printed by report.js), and per phase the build turns tested and the percentage with the hulls and loadout among the listed
		//builds (loadout), the hulls in the top build (top1) and the hulls among the listed builds (listed)
		estimateAccuracy: {"version":7,"model":"b90b1d20","date":"2026-11-22","games":102,"phases":{"all":{"turns":19239,"loadout":22.7,"top1":55,"listed":76},"opening":{"turns":4971,"loadout":45.6,"top1":78.9,"listed":94.9},"early":{"turns":5335,"loadout":21.7,"top1":57.1,"listed":82},"nearCap":{"turns":8933,"loadout":10.5,"top1":40.5,"listed":62}}},
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

			//a predicted future turn is no sighting, and would count as the next turn and make the list skip the real one
			if (this.isPredictedTurn()) {
				console.log("EnemyShipListPlugin: Predicted future turn: ignored.");
				return;
			}
			//the list ran through predicted turns before they were skipped: take them back on the real current turn
			if (!vgap.inHistory && vgap.nowTurn > 0 && this.currentListTurn > vgap.nowTurn)
				this.dropPredictedTurns();

			//the scoreboard of any loaded turn is valid on its own, so record it even if the list is not updated
			this.recordScores();
			this.recordMinefields();

			if (vgap.game.turn <= this.currentListTurn) {
				//an older turn still shows what it saw: it fills in or corrects the history kept for it
				this.backfillMassHistory();
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
					var oldMinMass = null;
					//loop through list of enemy ships and delete ship with same id
					for (var es = 0; es < this.enemyShipList.length; es++) {
						if (this.enemyShipList[es].id == ship.objectid) {
							//remove ship
							deletedData = this.enemyShipList.splice(es, 1);
							//ids are reused once a ship is destroyed; a ship never changes hull, so another hull is a new ship
							if (deletedData && deletedData.length > 0 && deletedData[0].hullid == ship.hullid) {
								oldShipHistory = deletedData[0].history;
								oldPredictedLoadout = deletedData[0].predictedLoadout;
								oldMinMass = this.getMinSeenMass(deletedData[0]);
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
						//lightest mass the ship was ever seen with
						if (oldMinMass != null)
							n.minMass = n.mass > 0 ? Math.min(oldMinMass, n.mass) : oldMinMass;
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
						if (ship.mass > 0)
							n.history[vgap.game.turn]['m'] = ship.mass;
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
					var oldMinMass = null;
				//loop through list of enemy ships and delete ship with same id
				for (var es = 0; es < this.enemyShipList.length; es++) {
					if (this.enemyShipList[es].id == vgap.ships[i].id) {
						//remove ship
						deletedData = this.enemyShipList.splice(es, 1);
						//ids are reused once a ship is destroyed; a ship never changes hull, so another hull is a new ship
						if (deletedData && deletedData.length > 0 && deletedData[0].hullid == vgap.ships[i].hullid) {
							oldShipHistory = deletedData[0].history;
							oldPredictedLoadout = deletedData[0].predictedLoadout;
								oldMinMass = this.getMinSeenMass(deletedData[0]);
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
						//lightest mass the ship was ever seen with
						if (oldMinMass != null)
							n.minMass = n.mass > 0 ? Math.min(oldMinMass, n.mass) : oldMinMass;
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
				//mass at the end of the turn, over the mass seen in combat earlier in the turn
				if (vgap.ships[i].mass > 0)
					n.history[vgap.game.turn]['m'] = vgap.ships[i].mass;
				//warp the ship moved at: a ship that moved at warp 0 was towed
				if (vgap.ships[i].warp >= 0)
					n.history[vgap.game.turn]['w'] = vgap.ships[i].warp;
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
					html += "<td style='color:" + color + "'>" + ship.name + vgap.plugins["enemyShipListPlugin"].mergeControlHtml(ship) + vgap.plugins["enemyShipListPlugin"].historyButtonHtml(ship) + "</td>";
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
					html += "<td style='color:" + color + "; cursor:help;' title='" + vgap.plugins["enemyShipListPlugin"].massTooltip(ship) + "'>" + ship.mass + "</td>";
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
		 * known by the build turn are mostly carriers, otherwise the torpedo most likely made for the predicted ships, or for the
		 * fleet when they carry none (getLikelyTorpedoes: low grade launchers are rarely loaded), at 1 point per megacredit
		 * @return 		{name, value} or null if neither carriers nor torpedo ships are known
		 */
		getLoadedAmmo: function (ownerid, ships, turn) {
			var carriers = 0, torpedoShips = 0;
			for (var s = 0; s < ships.length; s++) {
				if (ships[s].hull.fighterbays > 0)
					carriers++;
				else if (ships[s].torpedo)
					torpedoShips++;
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
			}
			//new ships are loaded where they are built, so their torpedoes come first
			//only launchers known count: with none, the race's usual torpedoes are no sign of ammo loaded
			var likely = torpedoShips > 0 ? this.getLikelyTorpedoes(ownerid, turn, ships, "made", ships.some(function (x) { return x.torpedo; })) : [];
			var torpedo = likely.length > 0 ? likely[0].torpedo : null;
			if (carriers > 0 && carriers >= torpedoShips)
				return { name: "fighters loaded", value: 125 };
			if (torpedo && torpedo.torpedocost > 0)
				return { name: torpedo.name + " torpedoes loaded", value: torpedo.torpedocost };
			return null;
		},

		//torpedoes made (loaded or laid as mines) and laid as mines per launcher of each type and turn, by torpedo id, in complete games
		//(tools/ammostats.py): low grade launchers are rarely loaded, so few of their torpedoes are made
		estimateTorpedoUse: {
			made: [0, 0.29, 0.2, 0.55, 0.42, 0.75, 1.12, 0.83, 1.2, 1.48, 1.27, 0.54],
			laid: [0, 0.17, 0.09, 0.34, 0.21, 0.54, 0.89, 0.57, 0.84, 1.13, 0.87, 0.27]
		},
		estimateTorpedoRecent: 5,	//turns after which a ship last seen that long ago counts half (0: all count fully)
		estimateTorpedoPrior: 0,	//launchers' worth of weight the race's usual torpedoes add next to the fleet

		/**
		 * The torpedoes a player likely makes, for loading ("made") or laying as mines ("laid"): each type by the launchers of that type
		 * on the player's ships known by the turn and the predicted ships, times how much each launcher of the type is used in complete
		 * games (estimateTorpedoUse). With no torpedo ship known, the race's usual builds in the phase stand in for the fleet.
		 * @param ships		predicted warships [{hull, torpedo}] to add to the fleet, may be empty
		 * @param use		"made" or "laid"
		 * @param shipsOnly	true to judge by the predicted ships alone
		 * @return 			[{torpedo, p}], likeliest first; empty if no launchers are known
		 */
		getLikelyTorpedoes: function (ownerid, turn, ships, use, shipsOnly) {
			var rate = this.estimateTorpedoUse[use], weights = {};
			var add = function (id, launchers) { if (id > 0 && launchers > 0) weights[id] = (weights[id] || 0) + launchers * (rate[id] != null ? rate[id] : 1); };
			for (var s = 0; s < ships.length; s++) {
				if (ships[s].torpedo)
					add(ships[s].torpedo.id, ships[s].hull.launchers);
			}
			var known = shipsOnly ? [] : this.getKnownShips(turn);
			for (var s = 0; s < known.length; s++) {
				var ship = known[s];
				if (ship.ownerid != ownerid || !(ship.torpedoid > 0) || this.getSeenTurns(ship).first > turn)
					continue;
				var hull = vgap.getHull(ship.hullid);
				var age = this.estimateTorpedoRecent > 0 ? Math.pow(0.5, Math.max(0, turn - this.getSeenTurns(ship).last) / this.estimateTorpedoRecent) : 1;
				add(ship.torpedoid, age * (ship.torps > 0 ? ship.torps : hull ? hull.launchers : 0));
			}
			var fleet = Object.keys(weights).length > 0;
			if (!fleet || this.estimateTorpedoPrior > 0) {
				var focus = this.getRaceFocus(ownerid, this.getBuildPhase(turn).key), prior = {}, sum = 0;
				for (var f = 0; f < focus.length; f++) {
					for (var o = 0; o < focus[f].outfits.length; o++) {
						var t = focus[f].outfits[o].torpedo;
						if (t) {
							prior[t.id] = (prior[t.id] || 0) + focus[f].share * focus[f].outfits[o].share * focus[f].hull.launchers;
							sum += focus[f].share * focus[f].outfits[o].share * focus[f].hull.launchers;
						}
					}
				}
				for (var id in prior)
					add(parseInt(id, 10), fleet ? this.estimateTorpedoPrior * prior[id] / sum : prior[id]);
			}
			var total = 0, list = [];
			for (var id in weights) {
				var torpedo = vgap.getTorpedo(parseInt(id, 10));
				if (torpedo) {
					list.push({ torpedo: torpedo, p: weights[id] });
					total += weights[id];
				}
			}
			list.forEach(function (x) { x.p /= total; });
			return list.sort(function (a, b) { return b.p - a.p; });
		},

		/**
		 * Military score change from a player's minefields, comparing the fields seen in a turn with the turn before the
		 * score row starts: mineValue points per mine unit gained or lost, less the torpedoes the laid mines were made of.
		 * A field seen in both turns was laid in if it holds more than decay leaves; a field first seen with a higher id
		 * than any field seen before was laid in the turn. Fields not seen in the turn are left out.
		 * @param ownerid	player id
		 * @param fromTurn	first turn of the score row
		 * @param turn		turn of the score row
		 * @return 			{fields, laid, units (change), torpedo (likeliest), likely (getLikelyTorpedoes), torpedoes (points used up), value} or null if no field of the
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
			//the torpedoes the player likely lays (else the ones the race usually builds): each type by its chance, making
			//torpedo id squared mine units (four times that for the Robots) for its megacredit cost
			var likely = this.getLikelyTorpedoes(ownerid, turn, [], "laid");
			var torpedo = likely.length > 0 ? likely[0].torpedo : null;
			var player = vgap.getPlayer(ownerid), torpedoes = 0;
			for (var i = 0; i < likely.length; i++)
				torpedoes += likely[i].p * laid / (likely[i].torpedo.id * likely[i].torpedo.id * (player && player.raceid == 9 ? 4 : 1)) * likely[i].torpedo.torpedocost;
			return { fields: fields, laid: laid, units: units, torpedo: torpedo, likely: likely, torpedoes: torpedoes, value: this.mineValue * units - torpedoes };
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
		 * Html of the button that shows a seen ship's movement history on the starmap
		 */
		historyButtonHtml: function (ship) {
			if (ship.predicted || !(ship.id > 0))
				return "";
			return " <button type='button' class='TestButton' title='Open the starmap filtered to this ship, showing all its sightings' " +
				"onMouseDown='event.preventDefault();' onClick='event.stopPropagation(); vgap.plugins[\"enemyShipListPlugin\"].showShipHistory(" + ship.id + ");'>History</button>";
		},

		/**
		 * Open the starmap with the map tools and the enemy ship tool expanded, filtered to a single ship with its whole
		 * movement history, zoomed to fit the path plus a margin of shipHistoryMargin light years
		 * @param shipId	id of the ship in the list
		 */
		showShipHistory: function (shipId) {
			var ship = this.getShipById(shipId);
			if (!ship)
				return;
			vgap.showMap();
			$("#MapControls").show();

			//the whole history, up to the viewed turn
			this.turnFrom = this.getSeenTurns(ship).first;
			this.turnTo = 0;
			this.drawSelection[ship.ownerid] = true;
			this.shipFilterId = ship.id;
			this.showShipFilter = true;
			if (this.mobile_version) {
				this.menuactive = true;
				this.showSelectionTool();
			} else {
				this.showOverlayFilter();
			}

			//fit the path and the margin on the screen
			var sightings = this.getSightingsInRange(ship, this.getTurnRange());
			if (sightings.length == 0)
				sightings = [{ x: ship.x, y: ship.y }];
			var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
			for (var s = 0; s < sightings.length; s++) {
				minX = Math.min(minX, sightings[s].x);
				maxX = Math.max(maxX, sightings[s].x);
				minY = Math.min(minY, sightings[s].y);
				maxY = Math.max(maxY, sightings[s].y);
			}
			var width = maxX - minX + 2 * this.shipHistoryMargin;
			var height = maxY - minY + 2 * this.shipHistoryMargin;
			var zoom = Math.min($(window).width() / width, $(window).height() / height);
			if (isFinite(zoom) && zoom > 0) {
				if (vgap.map.setZoom)
					vgap.map.setZoom(zoom);
				else
					vgap.map.zoom = zoom;
			}
			vgap.map.centerMap((minX + maxX) / 2, (minY + maxY) / 2);
			vgap.map.draw();
		},

		/**
		 * Number of turns shown in the mass column of an enemy ship's hull info popup
		 */
		massHistoryTurns: 5,
		transitMaxTurns: 20,	//most moves in a row counted as one transit in the mass popup
		transitLookback: 30,	//turns back the mass popup looks for the latest transit

		/**
		 * Check if the loaded turn is a prediction: the time machine's future view runs the host on the current turn,
		 * which moves enemy ships only by guesses (they stay put), so it is no sighting
		 */
		isPredictedTurn: function () {
			return !!(vgap.inHistory && vgap.inFuture) || (vgap.nowTurn > 0 && vgap.settings && vgap.settings.turn > vgap.nowTurn);
		},

		/**
		 * Take back turns the list ran through from predictions before they were skipped: sightings after the current turn
		 * are dropped, and so are ships only seen in them, so the real turns are read in when they come
		 */
		dropPredictedTurns: function () {
			var now = vgap.nowTurn;
			for (var s = this.enemyShipList.length - 1; s >= 0; s--) {
				var ship = this.enemyShipList[s];
				for (var key in ship.history || {}) {
					if (parseInt(key, 10) > now)
						delete ship.history[key];
				}
				if (Object.keys(ship.history || {}).length == 0 && parseInt(ship.infoturn, 10) > now)
					this.enemyShipList.splice(s, 1);
			}
			console.log("EnemyShipListPlugin: List was at predicted turn " + this.currentListTurn + ", set back to turn " + now + ".");
			this.currentListTurn = now;
			this.saveEnemyShipList();
		},

		/**
		 * Write what the listed ships seen in the loaded turn showed into their history for that turn: position, mass and
		 * warp. Used for turns the list has already processed, so browsing back fills in what lists from before kept none
		 * of, and replaces sightings taken from a predicted future turn (see isPredictedTurn) by the real ones.
		 */
		backfillMassHistory: function () {
			if (!vgap.ships)
				return;
			//in the time machine the viewed turn is in the settings; the game may still hold the current turn
			var turn = parseInt(vgap.settings && vgap.settings.turn, 10) || vgap.game.turn;
			var changed = 0;
			for (var i = 0; i < vgap.ships.length; i++) {
				var live = vgap.ships[i];
				//only ships seen this turn: NU keeps older sightings of enemy ships with their old position and mass
				if (!(live.id > 0) || (live.infoturn > 0 && parseInt(live.infoturn, 10) < turn))
					continue;
				var ship = this.getShipById(live.id);
				//the same ship: same hull, first seen no later than this turn
				if (!ship || ship.hullid != live.hullid || this.isSharedPlayer(ship.ownerid) || this.getSeenTurns(ship).first > turn)
					continue;
				if (!ship.history)
					ship.history = {};
				var entry = ship.history[turn] || (ship.history[turn] = {});
				var seen = { x: live.x, y: live.y };
				if (live.mass > 0)
					seen.m = live.mass;
				if (live.warp >= 0)
					seen.w = live.warp;
				var differs = false;
				for (var key in seen) {
					if (entry[key] !== seen[key]) {
						entry[key] = seen[key];
						differs = true;
					}
				}
				if (!differs)
					continue;
				if (seen.m > 0) {
					var min = this.getMinSeenMass(ship);
					ship.minMass = min != null ? Math.min(min, seen.m) : seen.m;
				}
				changed++;
			}
			console.log("EnemyShipListPlugin: History for turn " + turn + " filled in or corrected for " + changed + " ship(s).");
			if (changed > 0)
				this.saveEnemyShipList();
		},
		massHistoryWidth: 110,	//width added to the hull info popup for the mass column

		/**
		 * Add a column with the mass of the last massHistoryTurns turns to the right of the hull info popup, when it is
		 * opened from the screen of an enemy ship. It lives inside the popup, so it goes when the popup closes.
		 * @param hull	hull shown in the popup
		 */
		addMassHistoryToHullInfo: function (hull) {
			var screen = vgap.shipScreen;
			if (!vgap.shipScreenOpen || !screen || !screen.ship || !hull || screen.ship.hullid != hull.id || this.isSharedPlayer(screen.ship.ownerid))
				return;
			var dock = vgap.more.find("#SpaceDock");
			if (dock.length == 0)
				return;
			//the popup's own content stays together on the left, so its positioned parts keep their place
			var inner = $("<div style='position:relative; flex:0 0 auto;'></div>").append(dock.children());
			dock.css({ display: "flex", "align-items": "flex-start", gap: "10px" }).append(inner).append(this.massHistoryHtml(screen.ship.id));
			if (!vgap.more.hasClass("MoreFullScreen"))
				vgap.more.width(vgap.more.width() + this.massHistoryWidth);
		},

		/**
		 * Html of the mass of a ship over the last massHistoryTurns turns, one row per turn, oldest first
		 * @param shipId	id of the ship
		 */
		massHistoryHtml: function (shipId) {
			var listed = this.getShipById(shipId);
			var live = vgap.getShip ? vgap.getShip(shipId) : null;
			if (listed && live && listed.hullid != live.hullid)
				listed = null;
			var history = (listed && listed.history) || {};
			var transit = this.getTransitEstimate(shipId);

			var cells = "";
			var prev = null;
			for (var t = vgap.game.turn - this.massHistoryTurns + 1; t <= vgap.game.turn; t++) {
				var mass = history[t] && history[t].m > 0 ? history[t].m : null;
				if (mass == null && t == vgap.game.turn && live && live.mass > 0)
					mass = live.mass;
				var color = "#999";
				if (mass != null && prev != null && mass != prev)
					color = mass > prev ? "#f99" : "#9f9";
				else if (mass != null)
					color = "#fff";
				var stepText = " title='" + this.tooltipText(transit.byTurn[t] || this.getTurnDetail(shipId, t)) + "'";
				cells += "<div" + stepText + " style='display:flex; justify-content:space-between; padding:2px 0; border-bottom:solid 1px #444;'>" +
					"<span style='color:#999;'>T" + t + "</span>" +
					"<span style='color:" + color + ";'>" + (mass != null ? mass + " kt" : "&ndash;") + "</span></div>";
				if (mass != null)
					prev = mass;
			}
			return "<div style='flex:0 0 " + (this.massHistoryWidth - 20) + "px; cursor:help;' title='" + this.tooltipText(transit.summary) + "'>" +
				"<div class='DarkBar'>Mass:</div>" + cells + "</div>";
		},

		/**
		 * Text lines for a title attribute: escaped, one line each
		 * @param lines		string or array of strings
		 */
		tooltipText: function (lines) {
			return this.escapeHtml([].concat(lines).join("\n")).replace(/\n/g, "&#10;");
		},

		/**
		 * Where a ship was seen in a turn, with its mass and warp when known: from the list's history, and for the
		 * viewed turn from the client's ship when it was seen this turn
		 * @return 		{x, y, m, w} (m and w null when unknown), null if not seen in the turn
		 */
		getSighting: function (listed, live, turn) {
			var entry = listed && listed.history ? listed.history[turn] : null;
			var sighting = entry ? { x: entry.x, y: entry.y, m: entry.m > 0 ? entry.m : null, w: entry.w != null ? entry.w : null } : null;
			if (turn == vgap.game.turn && live && !this.isPredictedTurn() && !(live.infoturn > 0 && parseInt(live.infoturn, 10) < turn)) {
				if (!sighting)
					sighting = { x: live.x, y: live.y, m: null, w: null };
				if (sighting.m == null && live.mass > 0)
					sighting.m = live.mass;
				if (sighting.w == null && live.warp >= 0)
					sighting.w = live.warp;
			}
			return sighting;
		},

		/**
		 * The ship towing or towed by a ship in a move: another ship seen at the same place before and after the move,
		 * where one of the two moved at warp 0 (a towed ship shows warp 0 while moving)
		 * @param ship		listed ship
		 * @param from		its sighting before the move, turn - 1
		 * @param to		its sighting after the move
		 * @return 			{role: "towing" or "towed", ship, mass (of the towed ship before the move, null if unknown)}, or null
		 */
		findTowPartner: function (ship, from, to, turn) {
			for (var s = 0; s < this.enemyShipList.length; s++) {
				var other = this.enemyShipList[s];
				if (other.id == ship.id)
					continue;
				var live = vgap.getShip ? vgap.getShip(other.id) : null;
				if (live && live.hullid != other.hullid)
					live = null;
				var a = this.getSighting(other, live, turn - 1), b = this.getSighting(other, live, turn);
				if (!a || !b || Math.dist(a.x, a.y, from.x, from.y) > 1 || Math.dist(b.x, b.y, to.x, to.y) > 1)
					continue;
				if (b.w === 0 && to.w > 0)
					return { role: "towing", ship: other, mass: a.m };
				if (to.w === 0 && b.w > 0)
					return { role: "towed", ship: other, mass: from.m };
			}
			return null;
		},

		/**
		 * Fuel a ship burns in one move, by the client's formula, for each engine it may have
		 * @return 		{min, max} in kt, null if the client has no fuel formula
		 */
		getMoveFuel: function (ship, distance, mass, warp) {
			if (!vgap.turnFuel || !vgap.getXV || !vgap.getSpeed)
				return null;
			var engine = ship.engineid > 0 ? vgap.getEngine(ship.engineid) : null;
			var engines = engine ? [engine] : vgap.engines;
			var mods = vgap.getFuelEfficiencyMods ? vgap.getFuelEfficiencyMods({ ownerid: ship.ownerid, hullid: ship.hullid }) : null;
			var turndistance = vgap.getSpeed(warp, ship.hullid);
			var range = null;
			for (var e = 0; e < engines.length; e++) {
				var fuel = vgap.turnFuel(distance, mass, vgap.getXV(engines[e], warp) || 0, turndistance, 0, mods);
				range = range ? { min: Math.min(range.min, fuel), max: Math.max(range.max, fuel) } : { min: fuel, max: fuel };
			}
			return range;
		},

		/**
		 * One move of a ship: distance, warp, tow, fuel burned and mass change
		 * @param from		sighting before the move (turn - 1)
		 * @param to		sighting after the move
		 * @return 		{lines: text, distance, fuel ({min, max}, null if not estimated), change (mass, null if unknown)}
		 */
		getMoveDetail: function (ship, from, to, t) {
			var distance = Math.dist(from.x, from.y, to.x, to.y);
			var line = "T" + (t - 1) + " to T" + t + ": " + Math.round(distance) + " ly";
			var notes = [];
			//warp the move was made at: as seen, else the lowest warp that covers the distance
			var warp = to.w != null ? to.w : from.w;
			var tow = this.findTowPartner(ship, from, to, t);
			if (tow && tow.role == "towed")
				warp = 0;
			if (warp == null || (warp == 0 && !tow)) {
				warp = Math.min(9, Math.ceil(Math.sqrt(distance / (vgap.getSpeed ? vgap.getSpeed(1, ship.hullid) : 1))));
				notes.push("warp not seen, at least W" + warp);
			}
			line += " at W" + warp;
			var fuel = null;
			if (tow && tow.role == "towed") {
				notes.push("towed by #" + tow.ship.id + " " + tow.ship.name + " (this ship shows W0), the tower burns the fuel");
				fuel = { min: 0, max: 0 };
			} else if (vgap.getSpeed && distance > vgap.getSpeed(warp, ship.hullid) + 1) {
				notes.push("farther than W" + warp + " goes: jumped or warped, fuel not estimated");
			} else if (from.m != null) {
				var mass = from.m;
				if (tow) {
					notes.push("towing #" + tow.ship.id + " " + tow.ship.name + " (shows W0" + (tow.mass != null ? ", " + tow.mass + " kt" : ", mass unknown") + ")");
					if (tow.mass != null)
						mass += tow.mass;
				}
				fuel = this.getMoveFuel(ship, distance, mass, warp);
				if (tow && tow.mass == null)
					fuel = null;
			}
			var change = from.m != null && to.m != null ? to.m - from.m : null;
			line += ", mass " + (from.m != null ? from.m : "?") + " to " + (to.m != null ? to.m : "?") + " kt" +
				(change != null ? " (" + (change > 0 ? "+" : "") + change + ")" : "");
			line += ", fuel burn " + (fuel ? (fuel.min == fuel.max ? fuel.min : fuel.min + "-" + fuel.max) + " kt" : "?");
			return { lines: [line].concat(notes.map(function (n) { return "  " + n; })), distance: distance, fuel: fuel, change: change, warp: warp, tow: tow };
		},

		/**
		 * The 5 summary lines of a run of moves: span and distance, engine, fuel burn, mass change, and what the fuel burn
		 * does not explain. A single move also names its warp and any tow on the first line.
		 * @param moves		results of getMoveDetail, oldest first; a ship that did not move has one move of 0 ly
		 */
		getMoveSummary: function (ship, moves, first, last) {
			var engine = ship.engineid > 0 ? vgap.getEngine(ship.engineid) : null;
			var total = { distance: 0, fuelMin: 0, fuelMax: 0, massChange: 0, fuelKnown: true, massKnown: true };
			for (var m = 0; m < moves.length; m++) {
				total.distance += moves[m].distance;
				if (moves[m].fuel) {
					total.fuelMin += moves[m].fuel.min;
					total.fuelMax += moves[m].fuel.max;
				} else
					total.fuelKnown = false;
				if (moves[m].change != null)
					total.massChange += moves[m].change;
				else
					total.massKnown = false;
			}
			var span = "Transit T" + (first - 1) + " to T" + last + ": ";
			var head;
			if (moves.length == 1 && moves[0].distance == 0)
				head = span + "did not move, 0 ly";
			else {
				head = span + moves.length + " move" + (moves.length == 1 ? "" : "s") + ", " + Math.round(total.distance) + " ly";
				if (moves.length == 1 && moves[0].warp != null)
					head += " at W" + moves[0].warp;
				var tow = moves.length == 1 ? moves[0].tow : null;
				if (tow)
					head += tow.role == "towing" ? ", towing #" + tow.ship.id + " " + tow.ship.name : ", towed by #" + tow.ship.id + " " + tow.ship.name;
			}
			var lines = [head];
			lines.push("Engine: " + (engine ? engine.name : "not seen, fuel shown from the most to the least efficient engine"));
			var fuelText = total.fuelMin == total.fuelMax ? total.fuelMin : total.fuelMin + "-" + total.fuelMax;
			lines.push("Estimated fuel burn: " + fuelText + " kt" + (total.fuelKnown ? "" : " (some moves not estimated)"));
			lines.push("Mass change: " + (total.massChange > 0 ? "+" : "") + total.massChange + " kt" + (total.massKnown ? "" : " (some masses not seen)"));
			if (total.fuelKnown && total.massKnown) {
				//what the fuel burn does not explain: cargo, ammo or fuel loaded (+) or unloaded (-) on the way
				var restMin = total.massChange + total.fuelMin, restMax = total.massChange + total.fuelMax;
				var restText = restMin == restMax ? (restMin > 0 ? "+" : "") + restMin : restMin + " to " + restMax;
				lines.push("Not explained by fuel: " + restText + " kt");
			}
			return lines;
		},

		originMaxPlanets: 6,	//most planets listed as where a ship first seen in deep space may have come from
		warpWellRadius: 3,		//light years around a planet that count as at the planet

		/**
		 * Where a ship first seen in deep space may have come from: the planets within one turn's move of where it was
		 * seen (at its warp if seen, else warp 9), nearest first, with the fuel that move burns
		 * @param ship		listed or live ship
		 * @param to		its sighting, {x, y, m, w}
		 * @return 		lines of text, empty if the ship was seen at a planet or no planets are known
		 */
		getOriginLines: function (ship, to) {
			if (!vgap.planets || !vgap.getSpeed)
				return [];
			var plugin = this;
			for (var p = 0; p < vgap.planets.length; p++) {
				if (Math.dist(vgap.planets[p].x, vgap.planets[p].y, to.x, to.y) <= this.warpWellRadius)
					return [];
			}
			var warp = to.w > 0 ? to.w : 9;
			var reach = vgap.getSpeed(warp, ship.hullid) + this.warpWellRadius;
			var candidates = [];
			for (var p = 0; p < vgap.planets.length; p++) {
				var planet = vgap.planets[p];
				var distance = Math.dist(planet.x, planet.y, to.x, to.y);
				if (distance <= reach)
					candidates.push({ planet: planet, distance: distance });
			}
			candidates.sort(function (a, b) { return a.distance - b.distance; });
			var lines = ["First seen in deep space at (" + to.x + "," + to.y + "). Planets within one turn at W" + warp +
				(to.w > 0 ? "" : " (warp not seen)") + ", " + Math.round(reach) + " ly:"];
			if (candidates.length == 0)
				return lines.concat(["  none: it came from farther away over turns it was not seen, or jumped"]);
			var fuelText = function (distance) {
				if (vgap.gameUsesFuel && !vgap.gameUsesFuel())
					return "";
				if (to.m == null)
					return ", fuel burn ? (mass not seen)";
				//the ship was heavier by the fuel it burned on the way
				var first = plugin.getMoveFuel(ship, distance, to.m, warp);
				if (!first)
					return "";
				var min = plugin.getMoveFuel(ship, distance, to.m + first.min, warp).min;
				var max = plugin.getMoveFuel(ship, distance, to.m + first.max, warp).max;
				return ", fuel burn " + (min == max ? min : min + "-" + max) + " kt";
			};
			for (var c = 0; c < candidates.length && c < this.originMaxPlanets; c++) {
				var planet = candidates[c].planet;
				var notes = [];
				if (planet.ownerid > 0) {
					var owner = vgap.getPlayer(planet.ownerid);
					notes.push(planet.ownerid == ship.ownerid ? "own planet" : "owner " + (owner ? owner.username : planet.ownerid));
				} else
					notes.push("unowned or not known");
				if (vgap.getStarbase && vgap.getStarbase(planet.id))
					notes.push("starbase");
				lines.push("  #" + planet.id + " " + planet.name + ": " + Math.round(candidates[c].distance) + " ly (" + notes.join(", ") + ")" + fuelText(candidates[c].distance));
			}
			if (candidates.length > this.originMaxPlanets)
				lines.push("  and " + (candidates.length - this.originMaxPlanets) + " more farther away");
			return lines;
		},

		/**
		 * Hover lines for one turn of the mass column: the move into the turn, or why there is none
		 */
		getTurnDetail: function (shipId, t) {
			var listed = this.getShipById(shipId);
			var live = vgap.getShip ? vgap.getShip(shipId) : null;
			if (listed && live && listed.hullid != live.hullid)
				listed = null;
			var ship = listed || live;
			if (!ship)
				return [];
			var from = this.getSighting(listed, live, t - 1), to = this.getSighting(listed, live, t);
			if (!to)
				return ["T" + t + ": not seen"];
			if (!from)
				return ["T" + t + ": seen" + (to.m != null ? " at " + to.m + " kt" : "") + ", not seen in T" + (t - 1) + ", so no move to compare"].concat(this.getOriginLines(ship, to));
			if (vgap.gameUsesFuel && !vgap.gameUsesFuel())
				return ["This game does not use fuel."];
			var move = Math.dist(from.x, from.y, to.x, to.y) > 0.5 ? this.getMoveDetail(ship, from, to, t) :
				{ distance: 0, fuel: { min: 0, max: 0 }, change: from.m != null && to.m != null ? to.m - from.m : null };
			return this.getMoveSummary(ship, [move], t, t);
		},

		/**
		 * The latest transit of a ship: the turns in a row, up to transitMaxTurns, in which it was seen moving, with the
		 * fuel each move burns next to the change in its mass, and any ship it towed or was towed by
		 * @return 		{summary: lines of text, byTurn: lines per turn of a move}
		 */
		getTransitEstimate: function (shipId) {
			var plugin = this;
			var listed = this.getShipById(shipId);
			var live = vgap.getShip ? vgap.getShip(shipId) : null;
			if (listed && live && listed.hullid != live.hullid)
				listed = null;
			var ship = listed || live;
			var result = { summary: [], byTurn: {} };
			if (!ship)
				return result;
			if (vgap.gameUsesFuel && !vgap.gameUsesFuel()) {
				result.summary.push("This game does not use fuel.");
				return result;
			}
			var sighting = function (t) { return plugin.getSighting(listed, live, t); };
			var moved = function (t) {
				var a = sighting(t - 1), b = sighting(t);
				return !!(a && b && Math.dist(a.x, a.y, b.x, b.y) > 0.5);
			};
			//the latest move, then the moves before it in a row
			var last = vgap.game.turn;
			while (last > vgap.game.turn - this.transitLookback && !moved(last))
				last--;
			if (!moved(last)) {
				result.summary.push("Transit: not seen moving in the last " + this.transitLookback + " turns.");
				//a ship that appeared and stayed put: where it may have come from
				var appeared = vgap.game.turn;
				while (appeared > vgap.game.turn - this.transitLookback && sighting(appeared - 1))
					appeared--;
				if (sighting(appeared) && !sighting(appeared - 1))
					result.summary = result.summary.concat(this.getOriginLines(ship, sighting(appeared)));
				return result;
			}
			var first = last;
			while (first > last - this.transitMaxTurns + 1 && moved(first - 1))
				first--;

			var moves = [];
			for (var t = first; t <= last; t++) {
				var move = this.getMoveDetail(ship, sighting(t - 1), sighting(t), t);
				moves.push(move);
				result.byTurn[t] = this.getMoveSummary(ship, [move], t, t);
			}
			result.summary = this.getMoveSummary(ship, moves, first, last);
			return result;
		},

		/**
		 * Lightest mass a seen ship was observed with, null if never seen with a mass
		 */
		getMinSeenMass: function (ship) {
			var mass = parseInt(ship.mass, 10);
			var min = parseInt(ship.minMass, 10);
			if (!(mass > 0))
				return min > 0 ? min : null;
			return min > 0 ? Math.min(min, mass) : mass;
		},

		/**
		 * Mass of a ship without fuel, cargo, torpedoes or fighters: hull, beams and launchers (engines weigh nothing).
		 * Where the beams or launchers are not known, the lightest case has none and the heaviest has all slots
		 * filled with the heaviest kind.
		 * @return 		{min, max}, null if the hull is unknown
		 */
		getEmptyMassRange: function (ship) {
			var hull = vgap.getHull(ship.hullid);
			if (!hull)
				return null;
			var range = { min: hull.mass, max: hull.mass };
			var add = function (slots, id, count, lookup, list) {
				if (!(slots > 0))
					return;
				var item = id > 0 && count > 0 ? lookup(id) : null;
				if (item) {
					range.min += item.mass * count;
					range.max += item.mass * count;
					return;
				}
				var heaviest = 0;
				for (var i = 0; i < list.length; i++)
					heaviest = Math.max(heaviest, list[i].mass || 0);
				range.max += heaviest * slots;
			};
			add(hull.beams, parseInt(ship.beamid, 10), parseInt(ship.beams, 10), function (id) { return vgap.getBeam(id); }, vgap.beams);
			add(hull.launchers, parseInt(ship.torpedoid, 10), parseInt(ship.torps, 10), function (id) { return vgap.getTorpedo(id); }, vgap.torpedos);
			return range;
		},

		/**
		 * Hover text for the mass of a ship in the ship lists: the possible empty mass, the lightest mass seen, the
		 * fuel tank and cargo hold, and the fuel, cargo and ammo the ship carried at its lightest sighting for the
		 * lightest and heaviest empty mass. Predicted ships were never seen, so what needs a sighting is '?'.
		 * @return 		text safe to put in a single quoted title attribute
		 */
		massTooltip: function (ship) {
			var hull = vgap.getHull(ship.hullid);
			if (!hull)
				return "";
			var range = this.getEmptyMassRange(ship);
			var observed = ship.predicted ? null : this.getMinSeenMass(ship);
			var capacity = hull.fueltank + hull.cargo;
			var lines = [];
			lines.push("Empty mass (no fuel, cargo, torpedoes or fighters): " + (range.min == range.max ? range.min : range.min + " to " + range.max) + " kt");
			lines.push("Lightest mass seen: " + (observed != null ? observed + " kt" : "?"));
			lines.push("Fuel tank: " + hull.fueltank + " kt, cargo hold: " + hull.cargo + " kt (" + capacity + " kt total)");
			var loadLine = function (label, empty) {
				if (observed == null)
					return label + " (" + empty + " kt): carried ? kt, free ? kt";
				var carried = observed - empty;
				return label + " (" + empty + " kt): carried " + carried + " kt fuel/cargo/ammo, at least " + (capacity - carried) + " kt of fuel/cargo space free";
			};
			lines.push("At the lightest sighting:");
			lines.push(loadLine("  Lightest empty mass", range.min));
			if (range.max != range.min)
				lines.push(loadLine("  Heaviest empty mass", range.max));
			return this.escapeHtml(lines.join("\n")).replace(/\n/g, "&#10;");
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
			html += "<td style='color:" + this.colorsA[ship.ownerid] + "; font-style:italic; cursor:help;' title='" + this.massTooltip(ship) + "'>" + hull.mass + "</td>";
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
				html += " (" + mines.laid + " laid" + (mines.torpedo ? ", likely from " + mines.likely.filter(function (x) { return x.p >= 0.1; }).map(function (x) { return x.torpedo.name + " " + Math.round(100 * x.p) + "%"; }).join(", ") +
					" torpedoes worth " + Math.round(mines.torpedoes) + " military" : "") + ")";
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
						"<td>" + plugin.escapeHtml(entry.ship.name) + plugin.mergeControlHtml(entry.ship) + plugin.historyButtonHtml(entry.ship) + "</td>" +
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

			//a ship still visible on the viewed turn ends its path at where it is now, even when the list
			//has no sighting for this turn (e.g. the list was not updated for it)
			var live = this.getVisibleShip(ship);
			if (live) {
				sightings = sightings.filter(function (s) { return s.turn != vgap.game.turn; });
				sightings.push({ turn: vgap.game.turn, x: live.x, y: live.y });
			}

			sightings = sightings.filter(function (s) { return s.turn >= range.from && s.turn <= range.to; });
			sightings.sort(function (a, b) { return a.turn - b.turn; });
			return sightings;
		},

		/**
		 * The ship on the viewed turn that is the same ship as a list entry (same id and hull), null if not visible
		 * @param ship		ship from the list
		 */
		getVisibleShip: function (ship) {
			if (!ship || ship.predicted || !(ship.id > 0) || !vgap.ships)
				return null;
			for (var i = 0; i < vgap.ships.length; i++) {
				var s = vgap.ships[i];
				if (s.id != ship.id)
					continue;
				if (s.hullid != ship.hullid)
					return null;
				//NU may keep stale enemy ships from older turns; only a ship seen this turn is where it is drawn
				if (s.infoturn != null && parseInt(s.infoturn, 10) < vgap.game.turn)
					return null;
				return s;
			}
			return null;
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

	/**
	 * Overload the hull info popup (Hull Info on the ship screen): for an enemy ship, add its mass of the last turns on the right
	 */
	if (typeof shtml != "undefined" && shtml.showHullInfo) {
		vgap.plugins["enemyShipListPlugin"].oldShowHullInfo = shtml.showHullInfo;

		shtml.showHullInfo = function (hull) {
			vgap.plugins["enemyShipListPlugin"].oldShowHullInfo.apply(this, arguments);
			vgap.plugins["enemyShipListPlugin"].addMassHistoryToHullInfo(typeof hull === "number" ? vgap.getHull(hull) : hull);
		};
	}

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
