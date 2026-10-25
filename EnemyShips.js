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
1.41   Added a 'Build Predictor' tab. Records the scoreboard every turn and shows per player the changes in score, military score, warships and freighters, with the ships first seen each turn and a summary of the player's known and missing ships. A build estimate lists ship configurations that could explain a turn's military score change, tuned on complete games: it follows each race's usual fighters, sweepers and scouts in each phase of the game (opening, early, close to the ship limit), shows the starbase builds (starbase fighters, defense posts, loaded ammo) that make up the rest of the change, shows the starting build on turn 2 and lists every player's starting freighter until it is seen, lets a configuration be stored as the predicted build, listed and counted with the ships seen but marked as predicted until a matching ship is seen, and stops at the ship limit (the manual build, which also takes starbase builds, still works). A manual build can be stored as a custom predicted build.
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
		estimateResults: 8,		//configurations listed in the build estimate
		estimateClosestResults: 100,	//configurations returned by closeness to the military change (used by the tuning scripts)
		//build estimate tuning, fitted on complete games
		estimateSearchWidth: 200,		//partial ship sets kept per step of the search
		estimateRaceHullWeight: 0.5,	//weight of a race hull never seen in the player's fleet; each seen ship adds 1
		estimateFreshWeight: 8,			//weight added per ship first seen in the build turn or the next
		estimateFreshTurns: 2,			//turns after the build in which a first sighting counts as fresh
		estimateOpeningFill: 0.25,		//fraction of the ship limit in use below which a build counts as the opening
		//military score every player starts with (starbase with 100 defense and 20 fighters, homeworld with about 20 defense posts),
		//next to one Medium Deep Space Freighter with Transwarp engines. The turn 1 scoreboard shows 0 instead, so the turn 2
		//change would count them as built.
		startMilitary: 2110,
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
			opening: { name: "opening", hullSlope: 1, beamSlope: -3, torpedoSlope: -3, bestEngine: 8, cheapEngine: 1, seenWeight: 0.5, focusWeight: 20, focusOutfit: 0.75, outfitWeight: 0.5, fitWeight: 0.5,
				fit: [0.01, 0.02, 0.02, 0.01, 0.03, 0.04, 0.03, 0.06, 0.07, 0.07, 0.13, 0.5, 0.001, 0.001, 0.01, 0.001] },
			early: { name: "early game", hullSlope: 0, beamSlope: -3, torpedoSlope: -2, bestEngine: 2, cheapEngine: 3, seenWeight: 3, focusWeight: 5, focusOutfit: 0.75, outfitWeight: 0.25, fitWeight: 1,
				fit: [0.01, 0.02, 0.04, 0.03, 0.05, 0.05, 0.08, 0.07, 0.15, 0.1, 0.18, 0.18, 0.01, 0.01, 0.02, 0.01] },
			nearCap: { name: "close to the ship limit", hullSlope: 1, beamSlope: -2, torpedoSlope: -2, bestEngine: 4, cheapEngine: 3, seenWeight: 3, focusWeight: 10, focusOutfit: 0.5, outfitWeight: 1, fitWeight: 1,
				fit: [0.01, 0.02, 0.04, 0.04, 0.04, 0.06, 0.08, 0.12, 0.13, 0.11, 0.15, 0.06, 0.04, 0.03, 0.03, 0.02] },
			afterCap: { name: "ship limit reached", hullSlope: 1, beamSlope: 1, torpedoSlope: 2, bestEngine: 8, cheapEngine: 3, seenWeight: 3, focusWeight: 0, focusOutfit: 0, outfitWeight: 1, fitWeight: 1,
				fit: [0.05, 0.07, 0.08, 0.11, 0.1, 0.1, 0.09, 0.07, 0.07, 0.03, 0.04, 0.04, 0.01, 0.01, 0.04, 0.03] }
		},
		estimateFitEdges: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95, 1.0, 1.02, 1.05, 1.1, 1.25, 1.5],
		estimateFitFloor: 0.002,		//likelihood density of a fraction outside estimateFitEdges
		//usual builds per race (by race id) and phase, from complete games: [hull id, share of builds,
		//[[engine id, beam id, torpedo id, share of the hull's builds], ...]], beam or torpedo id 0 when built without
		estimateRaceFocus: {
			1: {	//Federation
				opening: [[5,0.293,[[9,2,1,0.2],[1,1,0,0.13],[9,3,6,0.13],[9,5,8,0.07]]],[3,0.198,[[1,2,0,0.4],[9,2,0,0.2],[3,3,0,0.2],[5,2,0,0.1]]],[7,0.196,[[9,2,6,0.3],[1,2,1,0.2],[1,2,6,0.1],[7,3,9,0.1]]],[8,0.157,[[7,2,0,0.38],[7,1,0,0.12],[1,1,0,0.12],[1,2,0,0.12]]],[9,0.096,[[9,5,0,0.4],[9,2,0,0.4],[9,3,0,0.2]]],[13,0.024,[[1,1,0,0.23],[9,3,9,0.18],[1,1,1,0.14],[9,2,9,0.09]]],[105,0.021,[[1,1,0,0.4],[1,2,0,0.3],[1,3,0,0.2],[6,6,0,0.1]]]],
				early: [[5,0.186,[[9,3,9,0.31],[1,1,0,0.15],[1,1,1,0.15],[1,2,6,0.15]]],[3,0.185,[[1,2,0,0.46],[1,1,0,0.23],[6,2,0,0.08],[9,2,0,0.08]]],[8,0.155,[[1,1,0,0.36],[1,2,0,0.36],[7,2,0,0.18],[3,2,0,0.09]]],[13,0.141,[[9,3,9,0.3],[1,1,1,0.2],[9,2,9,0.2],[1,1,0,0.1]]],[7,0.074,[[1,1,0,0.4],[1,3,9,0.4],[9,3,9,0.2]]],[19,0.071,[[1,1,0,0.8],[9,2,0,0.2]]],[105,0.07,[[1,2,0,0.6],[1,3,0,0.2],[1,1,0,0.2]]],[12,0.042,[[1,2,6,0.67],[1,1,5,0.33]]],[20,0.033,[[1,0,0,0.57],[1,1,0,0.1],[1,1,1,0.07],[9,3,11,0.07]]],[2011,0.028,[[1,0,0,0.67],[1,1,6,0.33]]]],
				nearCap: [[20,0.245,[[1,0,0,0.54],[1,1,0,0.11],[1,1,1,0.07],[9,3,11,0.07]]],[5,0.134,[[1,1,0,0.2],[1,2,1,0.2],[1,1,1,0.13],[9,7,10,0.07]]],[3,0.134,[[1,2,0,0.47],[1,1,0,0.27],[7,2,0,0.07],[9,3,0,0.07]]],[7,0.124,[[1,0,0,0.36],[1,1,0,0.29],[9,3,10,0.14],[1,2,1,0.07]]],[13,0.097,[[1,1,0,0.36],[1,1,1,0.09],[9,1,6,0.09],[1,1,6,0.09]]],[19,0.088,[[1,1,0,0.4],[9,3,0,0.2],[9,2,0,0.2],[9,7,0,0.1]]],[8,0.037,[[1,1,0,0.5],[5,4,0,0.25],[3,1,0,0.25]]],[105,0.036,[[1,1,0,0.5],[1,3,0,0.25],[6,6,0,0.25]]],[2011,0.035,[[1,0,0,0.75],[1,1,6,0.25]]],[104,0.026,[[1,6,0,0.33],[1,2,0,0.33],[1,1,0,0.33]]]]
			},
			2: {	//Lizard
				opening: [[22,0.351,[[9,6,6,0.22],[9,2,6,0.19],[9,2,9,0.15],[9,3,6,0.15]]],[8,0.273,[[1,2,0,0.38],[5,2,0,0.19],[1,3,0,0.1],[9,6,0,0.1]]],[24,0.183,[[1,1,0,0.43],[1,2,0,0.14],[3,2,0,0.14],[5,5,0,0.07]]],[21,0.102,[[9,2,0,0.75],[4,2,0,0.12],[9,3,0,0.12]]],[7,0.04,[[9,2,6,0.33],[5,2,6,0.33],[5,1,4,0.33]]],[105,0.027,[[1,2,0,0.68],[1,1,0,0.14]]],[23,0.021,[[9,3,9,0.17],[9,6,10,0.12],[9,6,9,0.12],[1,2,6,0.12]]]],
				early: [[24,0.26,[[1,1,0,0.32],[1,2,0,0.21],[1,3,0,0.11],[9,2,0,0.05]]],[8,0.213,[[1,2,0,0.32],[1,3,0,0.19],[5,1,0,0.16],[5,2,0,0.06]]],[22,0.201,[[9,3,6,0.21],[9,2,6,0.17],[9,6,10,0.1],[9,3,9,0.1]]],[23,0.126,[[9,6,9,0.28],[9,6,10,0.22],[9,3,9,0.22],[9,3,6,0.17]]],[7,0.089,[[5,2,6,0.54],[9,6,6,0.15],[1,1,0,0.08],[5,6,6,0.08]]],[105,0.048,[[1,2,0,0.71],[1,1,0,0.29]]],[1023,0.028,[[9,6,6,0.75],[9,6,10,0.25]]],[49,0.021,[[9,6,0,0.67],[9,2,0,0.33]]],[21,0.014,[[9,2,0,0.46],[9,6,0,0.08],[9,4,0,0.08],[9,1,0,0.08]]]],
				nearCap: [[23,0.299,[[9,3,9,0.17],[1,2,6,0.14],[9,6,10,0.11],[9,6,9,0.09]]],[22,0.243,[[9,6,6,0.12],[9,3,6,0.1],[9,7,10,0.09],[9,6,9,0.09]]],[8,0.163,[[1,3,0,0.35],[1,2,0,0.29],[5,2,0,0.09],[7,2,0,0.05]]],[24,0.087,[[1,1,0,0.34],[1,2,0,0.31],[4,1,0,0.1],[4,2,0,0.1]]],[49,0.065,[[1,2,0,0.45],[9,2,0,0.23],[9,3,0,0.09],[9,6,0,0.09]]],[1023,0.044,[[9,6,10,0.53],[9,9,10,0.4],[9,10,10,0.07]]],[7,0.042,[[9,2,6,0.21],[9,7,10,0.07],[5,2,2,0.07],[9,2,10,0.07]]],[105,0.039,[[1,2,0,0.62],[1,0,0,0.08],[1,5,0,0.08],[1,4,0,0.08]]]]
			},
			3: {	//Bird Men
				opening: [[27,0.435,[[9,2,0,0.59],[9,6,0,0.14],[9,3,0,0.14],[9,1,0,0.09]]],[31,0.264,[[9,2,6,0.38],[9,6,6,0.15],[9,1,6,0.15],[9,3,5,0.15]]],[28,0.117,[[9,2,6,0.83],[6,6,6,0.17]]],[106,0.101,[[6,2,1,0.4],[4,1,1,0.4],[5,2,1,0.2]]],[26,0.061,[[9,2,1,0.67],[9,2,3,0.33]]],[29,0.016,[[9,6,9,0.25],[9,6,10,0.07],[9,7,10,0.07],[9,9,9,0.07]]]],
				early: [[27,0.274,[[9,2,0,0.28],[9,6,0,0.22],[1,1,0,0.11],[1,3,0,0.11]]],[106,0.195,[[1,2,1,0.38],[9,1,6,0.23],[5,1,2,0.15],[7,2,6,0.08]]],[29,0.189,[[9,3,9,0.17],[9,3,7,0.17],[9,6,9,0.08],[8,6,6,0.08]]],[31,0.158,[[9,2,9,0.3],[9,6,9,0.3],[9,3,9,0.1],[9,3,5,0.1]]],[105,0.12,[[1,1,0,0.5],[1,2,0,0.5]]],[26,0.047,[[9,2,5,1.0]]],[28,0.016,[[9,2,6,0.88],[6,6,6,0.12]]]],
				nearCap: [[29,0.45,[[9,6,9,0.29],[9,6,10,0.09],[9,7,10,0.09],[9,9,9,0.09]]],[31,0.296,[[9,6,9,0.33],[9,2,9,0.14],[9,9,9,0.11],[9,6,10,0.06]]],[27,0.069,[[9,2,0,0.75],[7,3,0,0.12],[9,3,0,0.12]]],[26,0.066,[[9,2,5,0.25],[9,6,9,0.25],[9,2,3,0.12],[7,7,2,0.12]]],[104,0.041,[[1,2,0,0.4],[1,1,0,0.4],[3,2,0,0.2]]],[105,0.033,[[3,2,0,0.5],[1,1,0,0.25],[1,2,0,0.25]]],[106,0.026,[[7,2,1,0.33],[1,1,1,0.33],[7,1,2,0.33]]]]
			},
			4: {	//Fascist
				opening: [[36,0.385,[[9,2,6,0.24],[9,6,6,0.14],[9,2,2,0.14],[9,4,6,0.1]]],[39,0.287,[[1,2,0,0.4],[9,2,0,0.13],[1,1,0,0.13],[6,3,0,0.13]]],[107,0.108,[[1,6,0,0.33],[1,1,0,0.17],[9,2,0,0.17],[9,6,0,0.17]]],[37,0.093,[[9,2,6,0.6],[9,6,6,0.2],[9,3,6,0.2]]],[2038,0.056,[[9,4,6,0.67],[9,2,6,0.33]]],[59,0.036,[[9,2,0,0.67],[9,1,0,0.33]]],[33,0.019,[[9,10,10,0.29],[9,9,9,0.14],[9,10,9,0.14],[9,1,2,0.14]]],[35,0.011,[[9,3,9,0.18],[1,1,1,0.17],[9,2,9,0.12],[9,7,9,0.11]]]],
				early: [[39,0.424,[[1,1,0,0.31],[1,2,0,0.19],[5,3,0,0.16],[9,2,0,0.09]]],[36,0.174,[[9,3,6,0.38],[9,2,6,0.15],[9,2,9,0.15],[9,7,10,0.15]]],[37,0.105,[[9,6,9,0.25],[8,2,6,0.12],[9,2,6,0.12],[9,6,6,0.12]]],[105,0.091,[[1,3,0,0.71],[1,2,0,0.29]]],[35,0.085,[[9,7,9,0.33],[9,2,9,0.33],[9,7,6,0.17],[9,2,8,0.17]]],[2038,0.066,[[9,6,6,0.4],[9,4,6,0.2],[9,4,9,0.2],[9,6,9,0.2]]],[33,0.026,[[9,10,10,0.29],[9,9,9,0.14],[9,10,9,0.14],[9,1,2,0.14]]],[59,0.013,[[9,2,0,0.67],[9,1,0,0.33]]],[38,0.013,[[9,1,0,1.0]]]],
				nearCap: [[39,0.365,[[1,2,0,0.27],[5,3,0,0.19],[1,1,0,0.12],[5,2,0,0.12]]],[35,0.294,[[9,3,9,0.2],[1,1,1,0.18],[9,2,9,0.1],[9,7,9,0.08]]],[36,0.124,[[9,6,9,0.2],[9,2,9,0.2],[9,3,9,0.12],[9,4,9,0.08]]],[37,0.059,[[9,4,9,0.25],[9,2,9,0.17],[9,6,9,0.17],[9,6,6,0.17]]],[105,0.035,[[1,3,0,0.57],[1,2,0,0.29],[5,1,0,0.14]]],[2033,0.029,[[9,1,1,0.67],[9,4,9,0.33]]],[2038,0.025,[[9,6,9,0.6],[9,4,1,0.2],[9,1,1,0.2]]],[33,0.02,[[9,10,10,0.5],[9,9,9,0.25],[9,10,9,0.25]]],[1039,0.02,[[1,2,0,1.0]]],[104,0.015,[[1,3,0,0.33],[1,2,0,0.33],[1,6,0,0.33]]]]
			},
			5: {	//Privateer
				opening: [[46,0.705,[[9,2,6,0.56],[9,2,1,0.14],[8,2,6,0.07]]],[44,0.129,[[7,2,0,0.75],[8,2,0,0.12],[1,3,0,0.12]]],[42,0.128,[[1,2,1,0.62],[1,8,6,0.12],[6,2,6,0.12],[7,2,6,0.12]]],[45,0.016,[[7,3,6,0.2],[9,5,5,0.2],[5,2,0,0.2],[1,1,1,0.2]]],[1043,0.016,[[7,2,0,0.5],[7,6,0,0.5]]]],
				early: [[46,0.769,[[9,2,6,0.22],[9,6,6,0.13],[9,6,9,0.13],[9,2,9,0.07]]],[44,0.086,[[9,6,0,0.33],[9,2,0,0.17],[7,2,0,0.17],[2,2,0,0.17]]],[42,0.072,[[1,2,1,0.4],[3,2,9,0.2],[6,2,6,0.2],[5,2,1,0.2]]],[105,0.029,[[1,2,0,0.31],[6,9,0,0.15],[1,3,0,0.15],[5,9,0,0.08]]],[45,0.014,[[7,3,6,0.2],[9,5,5,0.2],[5,2,0,0.2],[1,1,1,0.2]]],[43,0.014,[[7,3,0,0.25],[1,2,0,0.25],[3,2,0,0.25],[3,3,0,0.25]]],[2048,0.014,[[9,6,1,1.0]]]],
				nearCap: [[46,0.689,[[9,6,9,0.14],[9,2,6,0.12],[9,2,9,0.1],[1,1,1,0.08]]],[44,0.08,[[5,7,0,0.33],[9,2,0,0.25],[8,2,0,0.17],[7,2,0,0.08]]],[105,0.072,[[1,2,0,0.27],[6,9,0,0.18],[5,9,0,0.09],[1,1,0,0.09]]],[42,0.053,[[1,2,1,0.5],[3,2,1,0.25],[3,2,2,0.12],[1,1,1,0.12]]],[50,0.033,[[9,10,0,0.6],[2,2,0,0.2],[9,6,0,0.2]]],[45,0.02,[[5,2,0,0.33],[1,1,1,0.33],[9,7,1,0.33]]],[43,0.02,[[1,2,0,0.33],[3,2,0,0.33],[3,3,0,0.33]]],[104,0.013,[[6,9,0,0.5],[7,9,0,0.5]]]]
			},
			6: {	//Cyborg
				opening: [[51,0.438,[[9,2,0,0.23],[1,1,0,0.19],[7,2,0,0.19],[5,2,0,0.12]]],[56,0.38,[[9,2,6,0.36],[5,2,6,0.18],[9,2,2,0.14],[9,1,6,0.09]]],[1054,0.052,[[9,2,0,0.67],[9,1,0,0.33]]],[1055,0.05,[[9,2,0,1.0]]],[54,0.034,[[9,2,0,0.17],[1,2,0,0.17],[1,1,0,0.17],[9,3,0,0.17]]],[52,0.024,[[9,2,0,0.2],[5,2,0,0.18],[1,2,0,0.11],[9,7,0,0.09]]],[105,0.018,[[1,2,0,0.5],[1,1,0,0.25],[2,2,0,0.12],[4,3,0,0.12]]]],
				early: [[56,0.447,[[6,2,6,0.13],[1,2,6,0.13],[9,2,6,0.13],[8,2,6,0.1]]],[51,0.274,[[1,1,0,0.21],[5,2,0,0.21],[7,3,0,0.16],[7,2,0,0.11]]],[105,0.043,[[2,2,0,0.33],[1,2,0,0.33],[1,1,0,0.33]]],[1058,0.043,[[9,4,9,1.0]]],[1055,0.043,[[6,6,0,0.67],[9,2,0,0.33]]],[52,0.035,[[9,2,0,0.2],[5,2,0,0.18],[1,2,0,0.11],[9,7,0,0.09]]],[54,0.029,[[9,2,0,0.17],[1,2,0,0.17],[1,1,0,0.17],[9,3,0,0.17]]],[104,0.028,[[1,2,0,1.0]]],[1054,0.016,[[9,2,0,0.5],[9,1,0,0.12],[1,1,0,0.12],[1,2,0,0.12]]],[53,0.014,[[7,7,9,0.25],[5,2,6,0.25],[9,8,10,0.25],[4,3,9,0.25]]]],
				nearCap: [[56,0.391,[[1,2,1,0.14],[1,1,1,0.07],[9,7,10,0.05],[9,6,9,0.05]]],[52,0.276,[[9,2,0,0.21],[5,2,0,0.19],[9,7,0,0.1],[1,2,0,0.1]]],[51,0.154,[[1,1,0,0.35],[1,2,0,0.26],[5,2,0,0.09]]],[1054,0.079,[[9,2,0,0.5],[1,2,0,0.17],[6,2,0,0.17],[9,1,0,0.08]]],[1058,0.033,[[9,4,9,0.4],[8,1,9,0.2],[9,1,9,0.2],[9,4,6,0.2]]],[105,0.027,[[1,2,0,0.5],[1,1,0,0.25],[4,3,0,0.25]]],[53,0.02,[[7,7,9,0.33],[9,8,10,0.33],[4,3,9,0.33]]],[54,0.013,[[9,2,0,0.17],[1,2,0,0.17],[1,1,0,0.17],[9,3,0,0.17]]]]
			},
			7: {	//Crystal
				opening: [[66,0.343,[[7,2,6,0.27],[9,2,6,0.27],[1,2,9,0.13],[7,1,6,0.13]]],[60,0.304,[[9,2,6,0.38],[9,2,9,0.15],[9,3,6,0.15],[7,1,6,0.15]]],[61,0.286,[[9,2,6,0.75],[9,3,6,0.17],[9,6,6,0.08]]],[64,0.024,[[1,2,1,0.17],[4,2,9,0.17],[1,2,9,0.17],[9,2,9,0.17]]],[110,0.024,[[6,2,9,0.5],[9,2,9,0.25],[5,2,10,0.25]]]],
				early: [[60,0.306,[[9,2,6,0.29],[7,1,6,0.29],[9,2,9,0.21],[9,3,9,0.07]]],[61,0.289,[[9,2,9,0.46],[9,3,6,0.31],[9,2,6,0.15],[7,4,9,0.08]]],[66,0.113,[[7,2,6,0.4],[9,2,9,0.2],[1,1,10,0.2],[5,1,9,0.2]]],[67,0.088,[[1,2,0,1.0]]],[63,0.067,[[7,3,6,0.33],[9,5,6,0.33],[9,3,9,0.33]]],[64,0.044,[[1,2,1,0.17],[4,2,9,0.17],[1,2,9,0.17],[9,2,9,0.17]]],[110,0.043,[[6,2,9,0.5],[9,2,9,0.25],[5,2,10,0.25]]],[105,0.024,[[1,2,0,0.78],[5,3,0,0.11],[1,1,0,0.11]]],[1065,0.023,[[1,1,0,1.0]]]],
				nearCap: [[61,0.279,[[9,2,9,0.26],[9,6,9,0.13],[9,2,10,0.1],[7,4,9,0.1]]],[60,0.173,[[9,2,9,0.16],[5,2,9,0.11],[9,3,9,0.11],[6,4,6,0.11]]],[67,0.098,[[4,2,0,0.27],[5,3,0,0.18],[1,2,0,0.18],[9,2,0,0.09]]],[63,0.089,[[9,2,10,0.2],[9,2,9,0.1],[1,2,7,0.1],[1,2,1,0.1]]],[62,0.089,[[5,10,6,0.3],[7,10,6,0.2],[5,9,6,0.2],[1,6,6,0.1]]],[66,0.083,[[1,1,6,0.22],[7,1,6,0.11],[7,2,6,0.11],[5,3,6,0.11]]],[105,0.071,[[1,2,0,0.75],[5,3,0,0.12],[1,1,0,0.12]]],[1065,0.062,[[1,1,0,1.0]]],[64,0.027,[[1,2,1,0.33],[4,2,9,0.33],[4,1,9,0.33]]]]
			},
			8: {	//Evil Empire
				opening: [[77,0.643,[[5,2,0,0.29],[7,2,0,0.12],[4,2,0,0.09],[5,1,0,0.09]]],[76,0.075,[[9,2,0,0.75],[7,2,0,0.25]]],[69,0.065,[[9,2,0,1.0]]],[75,0.059,[[1,2,9,0.33],[1,2,6,0.33],[7,2,6,0.33]]],[97,0.058,[[1,2,0,1.0]]],[72,0.021,[[9,2,0,0.75],[9,7,0,0.12],[7,2,0,0.12]]],[1076,0.02,[[7,2,0,0.5],[1,2,0,0.5]]],[68,0.019,[[9,2,0,1.0]]],[2076,0.019,[[7,2,0,0.5],[9,2,0,0.5]]],[70,0.014,[[1,2,0,0.17],[9,6,0,0.17],[5,2,0,0.11],[7,2,0,0.09]]]],
				early: [[77,0.202,[[3,1,0,0.27],[1,2,0,0.18],[5,1,0,0.18],[5,2,0,0.09]]],[69,0.181,[[9,2,0,0.2],[1,7,0,0.1],[9,3,0,0.1],[7,3,0,0.1]]],[75,0.159,[[7,2,6,0.22],[9,2,9,0.11],[1,1,9,0.11],[6,3,9,0.11]]],[70,0.134,[[5,2,0,0.29],[9,2,0,0.14],[7,6,0,0.14],[1,2,0,0.14]]],[105,0.089,[[1,2,0,0.8],[6,3,0,0.2]]],[1076,0.053,[[1,2,0,0.67],[7,2,0,0.33]]],[1073,0.053,[[9,2,0,1.0]]],[71,0.035,[[6,4,0,0.67],[1,2,0,0.33]]],[74,0.019,[[9,3,0,0.38],[9,2,0,0.25],[9,7,0,0.12],[9,6,0,0.12]]],[72,0.019,[[9,2,0,0.75],[9,7,0,0.12],[7,2,0,0.12]]]],
				nearCap: [[70,0.426,[[9,6,0,0.19],[1,2,0,0.17],[7,2,0,0.11],[5,2,0,0.09]]],[69,0.21,[[9,3,0,0.35],[9,6,0,0.17],[9,2,0,0.13],[5,7,0,0.09]]],[74,0.063,[[9,3,0,0.29],[9,2,0,0.29],[9,7,0,0.14],[9,6,0,0.14]]],[105,0.055,[[1,2,0,0.83],[1,6,0,0.17]]],[72,0.055,[[9,2,0,0.83],[9,7,0,0.17]]],[77,0.051,[[1,1,0,0.4],[5,2,0,0.2],[9,2,0,0.2],[5,1,0,0.2]]],[97,0.046,[[1,2,0,1.0]]],[75,0.029,[[7,2,10,0.33],[4,6,10,0.33],[9,2,7,0.33]]],[104,0.018,[[1,2,0,1.0]]]]
			},
			9: {	//Robot
				opening: [[81,0.559,[[9,2,6,0.31],[9,3,6,0.15],[9,4,6,0.08],[9,1,5,0.08]]],[82,0.237,[[1,0,0,0.82],[9,0,0,0.09],[6,0,0,0.09]]],[84,0.063,[[1,2,0,0.33],[1,1,0,0.33],[5,1,0,0.33]]],[2083,0.044,[[9,3,0,0.3],[7,2,0,0.3],[9,1,0,0.2],[1,2,0,0.1]]],[78,0.023,[[9,2,0,0.25],[1,2,0,0.17],[9,6,0,0.17],[9,3,0,0.17]]],[107,0.021,[[5,1,0,0.5],[1,3,0,0.5]]],[1084,0.021,[[9,2,0,1.0]]],[79,0.019,[[1,3,0,0.13],[5,6,0,0.1],[1,2,0,0.09],[5,3,0,0.09]]]],
				early: [[81,0.336,[[9,2,6,0.22],[9,5,10,0.22],[9,2,10,0.09],[9,6,10,0.09]]],[82,0.16,[[1,0,0,0.45],[9,0,0,0.36],[7,0,0,0.09],[8,0,0,0.09]]],[80,0.146,[[5,2,0,0.7],[5,3,0,0.2],[3,3,0,0.1]]],[79,0.126,[[5,6,0,0.38],[5,3,0,0.25],[9,2,0,0.12],[5,2,0,0.12]]],[78,0.072,[[9,2,0,0.4],[8,1,0,0.2],[7,2,0,0.2],[9,5,0,0.2]]],[105,0.072,[[1,2,0,0.8],[1,1,0,0.2]]],[2083,0.058,[[9,3,0,0.25],[1,2,0,0.25],[7,2,0,0.25],[7,4,0,0.25]]],[104,0.015,[[1,2,0,0.62],[1,5,0,0.12],[1,1,0,0.12],[3,2,0,0.12]]],[107,0.014,[[5,1,0,0.5],[1,3,0,0.5]]]],
				nearCap: [[79,0.462,[[1,3,0,0.14],[1,2,0,0.1],[5,6,0,0.08],[1,1,0,0.08]]],[81,0.184,[[9,2,10,0.26],[9,5,10,0.1],[9,7,10,0.1],[9,3,10,0.1]]],[80,0.135,[[9,3,0,0.17],[1,2,0,0.13],[5,3,0,0.13],[9,6,0,0.13]]],[82,0.077,[[1,0,0,0.69],[9,0,0,0.23],[4,0,0,0.08]]],[104,0.041,[[1,2,0,0.71],[1,1,0,0.14],[3,2,0,0.14]]],[78,0.035,[[1,2,0,0.33],[9,6,0,0.33],[9,3,0,0.33]]],[105,0.03,[[1,2,0,0.4],[1,1,0,0.2],[5,3,0,0.2],[3,2,0,0.2]]],[2083,0.024,[[9,3,0,0.5],[9,1,0,0.5]]]]
			},
			10: {	//Rebel
				opening: [[87,0.619,[[7,2,0,0.15],[9,3,0,0.15],[1,2,0,0.11],[9,6,0,0.06]]],[101,0.093,[[9,2,0,1.0]]],[86,0.079,[[9,6,6,0.67],[9,4,6,0.17],[9,2,9,0.17]]],[91,0.065,[[9,2,0,0.4],[9,1,0,0.2],[9,3,0,0.2],[9,4,0,0.2]]],[1093,0.065,[[9,2,0,0.4],[7,2,0,0.2],[9,3,0,0.2],[6,3,0,0.2]]],[103,0.027,[[9,3,6,0.33],[6,2,6,0.17],[9,4,6,0.17],[1,2,6,0.17]]],[94,0.022,[[9,10,0,0.12],[5,3,0,0.1],[7,3,0,0.09],[1,1,0,0.07]]],[100,0.014,[[9,6,0,0.2],[9,2,0,0.2],[5,2,0,0.2],[1,2,0,0.2]]],[1090,0.013,[[6,5,6,0.5],[9,2,6,0.5]]]],
				early: [[87,0.432,[[9,3,0,0.16],[6,2,0,0.12],[7,2,0,0.12],[9,1,0,0.09]]],[94,0.178,[[5,3,0,0.15],[9,6,0,0.15],[1,2,0,0.15],[7,5,0,0.08]]],[92,0.092,[[9,3,0,0.29],[9,6,0,0.29],[9,4,0,0.14],[9,2,0,0.14]]],[105,0.066,[[1,3,0,0.2],[1,2,0,0.2],[3,6,0,0.2],[1,1,0,0.2]]],[86,0.041,[[9,3,6,0.33],[5,4,6,0.33],[9,3,9,0.33]]],[101,0.029,[[9,2,0,0.42],[9,3,0,0.11],[1,1,0,0.11],[5,2,0,0.11]]],[103,0.027,[[9,3,6,0.33],[6,2,6,0.17],[9,4,6,0.17],[1,2,6,0.17]]],[100,0.027,[[9,6,0,0.2],[9,2,0,0.2],[5,2,0,0.2],[1,2,0,0.2]]],[2088,0.027,[[9,6,9,0.5],[9,2,6,0.25],[9,2,9,0.25]]],[1089,0.026,[[9,3,6,1.0]]]],
				nearCap: [[94,0.41,[[9,10,0,0.16],[5,3,0,0.09],[7,3,0,0.09],[6,6,0,0.07]]],[87,0.287,[[5,1,0,0.13],[6,2,0,0.07],[1,10,0,0.07],[1,4,0,0.07]]],[101,0.094,[[9,3,0,0.2],[5,2,0,0.2],[7,4,0,0.1],[9,7,0,0.1]]],[86,0.047,[[9,7,9,0.4],[9,5,6,0.2],[9,6,6,0.2],[9,3,9,0.2]]],[92,0.029,[[9,2,0,0.67],[9,5,0,0.33]]],[91,0.019,[[9,2,0,0.62],[9,1,0,0.12],[9,3,0,0.12],[9,4,0,0.12]]],[103,0.019,[[9,3,6,0.33],[6,2,6,0.17],[9,4,6,0.17],[1,2,6,0.17]]],[100,0.019,[[9,6,0,0.2],[9,2,0,0.2],[5,2,0,0.2],[1,2,0,0.2]]],[2088,0.019,[[9,6,9,0.5],[9,2,6,0.25],[9,2,9,0.25]]]]
			},
			11: {	//Colonies
				opening: [[96,0.665,[[9,2,6,0.78],[9,6,6,0.11],[9,2,0,0.05]]],[101,0.182,[[1,2,0,0.5],[9,2,0,0.3],[5,2,0,0.1],[5,1,0,0.1]]],[92,0.073,[[9,2,0,0.75],[5,2,0,0.25]]],[99,0.02,[[5,2,0,0.21],[1,2,0,0.2],[5,6,0,0.17],[4,2,0,0.1]]],[42,0.019,[[1,2,6,0.38],[1,2,1,0.25],[1,6,6,0.25],[1,1,6,0.12]]],[97,0.018,[[7,2,0,0.5],[1,1,0,0.25],[5,1,0,0.25]]],[100,0.018,[[7,6,0,0.67],[1,1,0,0.33]]]],
				early: [[96,0.295,[[9,2,6,0.55],[9,2,2,0.2],[9,2,0,0.1],[9,3,6,0.05]]],[99,0.255,[[1,2,0,0.41],[5,2,0,0.24],[1,1,0,0.12],[9,2,0,0.06]]],[101,0.146,[[9,2,0,0.7],[1,1,0,0.2],[4,2,0,0.1]]],[92,0.129,[[9,2,0,0.44],[9,1,0,0.22],[9,6,0,0.22],[5,2,0,0.11]]],[105,0.087,[[1,2,0,0.83],[1,1,0,0.17]]],[42,0.043,[[1,1,6,0.33],[1,6,6,0.33],[1,2,6,0.33]]],[97,0.015,[[7,2,0,0.5],[1,1,0,0.25],[5,1,0,0.25]]],[100,0.015,[[7,6,0,0.67],[1,1,0,0.33]]],[86,0.014,[[9,6,9,1.0]]]],
				nearCap: [[99,0.53,[[5,2,0,0.21],[5,6,0,0.2],[1,2,0,0.16],[4,2,0,0.1]]],[96,0.205,[[9,2,6,0.3],[9,2,9,0.24],[9,6,9,0.11],[9,1,6,0.05]]],[101,0.11,[[1,2,0,0.5],[5,2,0,0.15],[9,2,0,0.1],[1,1,0,0.1]]],[105,0.049,[[1,2,0,0.44],[1,4,0,0.22],[5,4,0,0.11],[1,1,0,0.11]]],[92,0.033,[[9,2,0,0.67],[9,6,0,0.33]]],[42,0.022,[[1,2,1,0.5],[1,2,6,0.5]]],[1095,0.016,[[1,8,0,0.33],[1,6,0,0.33],[1,2,0,0.33]]],[97,0.011,[[7,2,0,0.5],[1,1,0,0.25],[5,1,0,0.25]]]]
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
			this.reconcilePredictions();

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
		 * 					phase: result of getBuildPhase
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
					hullWeight[shipHull.id] = (hullWeight[shipHull.id] || 0) + 1;
					if (ship.engineid > 0 && vgap.getEngine(ship.engineid)) count(engines, ship.engineid);
					if (ship.beamid > 0 && vgap.getBeam(ship.beamid)) count(beams, ship.beamid);
					if (ship.torpedoid > 0 && vgap.getTorpedo(ship.torpedoid)) count(torpedos, ship.torpedoid);
				} else if (firstSeen < turn + this.estimateFreshTurns) {
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
			for (var k = 0; k < hullIds.length; k++) {
				var value = this.partValue(vgap.getHull(parseInt(hullIds[k], 10)), "cost");
				var cheaper = raceValues.filter(function (v) { return v < value; }).length;
				var rank = raceValues.length > 1 ? Math.min(1, cheaper / (raceValues.length - 1)) : 0.5;
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
				phase: buildPhase
			};
		},

		/**
		 * Find the sets of warships that best explain a turn's military score change. Each ship gets a hull with full
		 * beams and launchers; ships can differ in engine and weapons. A set is scored on how likely its hulls and
		 * outfits are and on how often builds in complete games were worth that fraction of the change: a set worth
		 * more than the change is unlikely, one worth less is common, as ammo, defense and minefields built in the
		 * same turn add to the change. Only the best scoring set of components is kept for each combination of hulls.
		 * @param ownerid	player id
		 * @param count		number of warships built
		 * @param target	military score change
		 * @param turn		build turn
		 * @return 			{ranked: [{ships: [{hull, engine, beam, torpedo}], value, diff}] best first, closest: the same
		 * 					closest to the change first, phase: result of getBuildPhase, focus: result of getRaceFocus}
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
			var addOption = function (hull, engine, beam, torpedo, p) {
				var key = hull.id + "|" + engine.id + "|" + (beam ? beam.id : 0) + "|" + (torpedo ? torpedo.id : 0);
				if (!byKey[key]) {
					byKey[key] = { hull: hull, engine: engine, beam: beam, torpedo: torpedo, p: 0,
						value: plugin.shipModelValue(hull, engine, beam, hull.beams, torpedo, hull.launchers) };
					options.push(byKey[key]);
				}
				byKey[key].p += p;
			};
			for (var h = 0; h < priors.hulls.length; h++) {
				var hull = priors.hulls[h].item;
				var outfits = (focusOutfits[hull.id] || []).filter(function (o) { return (!o.beam || hull.beams > 0) && (!o.torpedo || hull.launchers > 0); });
				var focusShare = outfits.length > 0 ? phase.focusOutfit : 0;
				for (var o = 0; o < outfits.length; o++)
					addOption(hull, outfits[o].engine, outfits[o].beam, outfits[o].torpedo, priors.hulls[h].p * focusShare * outfits[o].share);
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
						if (value > target * 1.5)
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
			var toResult = function (state) {
				return { ships: state.picks.map(function (o) { return options[o]; }), value: state.value, diff: state.value - target };
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
			//every set the search kept, closest to the military change first (likeliest first when equally close)
			var closest = states.map(toResult);
			closest.sort(function (a, b) { return Math.abs(a.diff) - Math.abs(b.diff); });
			return { ranked: ranked, closest: closest.slice(0, this.estimateClosestResults), phase: priors.phase, focus: priors.focus };
		},

		//starbase builds that make up the military change the ships leave unexplained, from complete games before the ship limit:
		//	value: military score points each; share: turns with such a build; mean: points such a build is usually worth
		//	(exponential fit to the median)
		estimateStarbaseItems: {
			fighters: { name: "starbase fighters", value: 62.5, share: 0.12, mean: 2525 },
			starbaseDefense: { name: "starbase defense posts", value: 7.5, share: 0.04, mean: 1125 },
			planetDefense: { name: "planetary defense posts", value: 5.5, share: 0.53, mean: 301 },
			ammo: { share: 0.38, mean: 1333 }	//torpedoes or fighters loaded on ships
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
			return this.predictedShips.concat(this.getStartingShips());
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
				if (seen[ownerid])
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
			this.predictedShips = this.predictedShips.filter(function (ship) {
				return !(ship.ownerid == ownerid && ship.predictedTurn == turn && plugin.isFreighter(ship) == freighters);
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
			this.showEnemyShipsView(8);
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
			this.showEnemyShipsView(8);
		},

		/**
		 * Store the usual starting freighter as a predicted build of turn 2
		 */
		storeStarterFreighter: function (ownerid, turn) {
			var starter = this.getStarterFreighter();
			if (!starter.hullItem)
				return;
			this.setPrediction(ownerid, turn, [{ hull: starter.hullItem, engine: starter.engineItem, beam: null, torpedo: null }], true);
			this.showEnemyShipsView(8);
		},

		/**
		 * Remove the predicted build of a player's turn
		 * @param freighters	true for the predicted freighters only, false for the warships only, undefined for both
		 */
		removePrediction: function (ownerid, turn, freighters) {
			var plugin = this;
			this.predictedShips = this.predictedShips.filter(function (ship) {
				return !(ship.ownerid == ownerid && ship.predictedTurn == turn && (freighters == null || plugin.isFreighter(ship) == freighters));
			});
			this.savePredictedShips();
		},

		/**
		 * Drop the predicted builds that a newly seen ship now accounts for: a ship of the same player and hull, first seen
		 * in or after the build turn and after the prediction was stored. Each seen ship accounts for one predicted build.
		 */
		reconcilePredictions: function () {
			if (this.predictedShips.length == 0)
				return;
			var used = {};
			var keep = [];
			for (var p = 0; p < this.predictedShips.length; p++) {
				var predicted = this.predictedShips[p];
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
		 * as a freighter it is a Large Deep Space Freighter with Transwarp engines (54 of 62 in complete games)
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

			//the one ship every player builds on turn 1 appears on turn 2
			var unknownFreighters = row.newFreighters;
			if (row.fromTurn <= 2 && row.turn >= 2) {
				html += "<p style='color:" + color + "'>Starting build: every player starts with a Medium Deep Space Freighter with Transwarp engines, " +
					"listed as a starting freighter until it is seen, and builds one ship on turn 1, which appears on turn 2.";
				if (row.newFreighters > 0) {
					var starter = plugin.getStarterFreighter();
					html += " Likely starting freighter: 1x " + starter.hull + " with " + starter.engine + " engines (54 of the 62 starting freighters in complete games).";
					if (plugin.getPredictedBuild(player.id, row.turn, true).length == 0 && starter.hullItem)
						html += " <button type='button' class='TestButton' title='Store as a predicted build of this turn' " +
							"onClick='vgap.plugins[\"enemyShipListPlugin\"].storeStarterFreighter(" + player.id + ", " + row.turn + ");'>Use</button>";
					unknownFreighters--;
				}
				html += "</p>";
			}
			//the predicted build stored for this turn, listed with the ships seen
			var storedBuild = plugin.getPredictedBuild(player.id, row.turn);
			if (storedBuild.length > 0) {
				html += "<p style='color:" + color + "'>Predicted build stored for this turn, listed with the ships seen until a matching ship is seen: " +
					plugin.predictedBuildText(storedBuild) +
					" <button type='button' class='TestButton' onClick='vgap.plugins[\"enemyShipListPlugin\"].removePrediction(" + player.id + ", " + row.turn + "); vgap.plugins[\"enemyShipListPlugin\"].showEnemyShipsView(8);'>Remove</button></p>";
			}
			if (unknownFreighters > 0) {
				html += "<p>" + unknownFreighters + " freighter" + (unknownFreighters == 1 ? "" : "s") + " built. Freighters do not count toward the military score, so their hulls cannot be estimated.</p>";
			}

			plugin.manualTarget = row.militaryChange;
			plugin.manualTurn = row.turn;

			//predicted configurations on the left, manual build on the right
			html += "<div style='display:flex; flex-wrap:wrap; align-items:flex-start; gap:32px;'><div>";
			if (!(row.newCapitals > 0)) {
				html += "<p>No new warships this turn.</p>";
				var builds = plugin.estimateStarbaseBuilds(player.id, [], row.militaryChange, row.turn);
				if (builds) {
					html += "<p style='color:" + color + "'>Starbase builds that make up the military change:<br>" + plugin.starbaseBuildsText(builds) +
						"<br>Total " + Math.round(builds.value) + plugin.formatChange(Math.round(builds.value - row.militaryChange)) + "</p>";
				}
			} else if (!(row.militaryChange > 0)) {
				html += "<p>The military score did not rise this turn, so the new ships cannot be estimated (losses hide their value).</p>";
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

			var estimate = plugin.estimateBuilds(ownerid, row.newCapitals, row.militaryChange, row.turn);
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
				results = (match.length > 0 ? match : [plugin.predictedResult(storedShips, row.militaryChange)]).concat(others);
			}
			addStarbase(results);
			//kept for the Use buttons, which store a configuration as the predicted build of the turn
			plugin.estimateCandidates = { ownerid: ownerid, turn: row.turn, ranked: results };
			html += "<h4>Predicted builds</h4>";
			html += plugin.buildConfigTableHtml(results, color, stored, ownerid, row.turn);
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
				"<th></th><th>Ships</th><th>Role</th><th>Engine</th><th>Beams</th><th>Torpedoes</th><th>Ships Military</th><th>Starbase Builds</th><th>Difference</th>" +
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
					"onClick='vgap.plugins[\"enemyShipListPlugin\"].removePrediction(" + ownerid + ", " + turn + ", false); vgap.plugins[\"enemyShipListPlugin\"].showEnemyShipsView(8);'>Remove</button></td>" :
					"<td><button type='button' class='TestButton' title='Store as the predicted build of this turn' " +
					"onClick='vgap.plugins[\"enemyShipListPlugin\"].storePrediction(" + r + ");'>Use</button></td>";
				html += "<tr style='color:" + color + (predicted ? "; background:rgba(255,255,255,0.12); font-style:italic;" : "") + "'>" + use +
					column(function (g) { return g.count + "x " + g.ship.hull.name; }) +
					column(function (g) { return plugin.getShipRole(g.ship.hull); }) +
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
		 * recorded turn, and the known ships of that player with their first and last sighting
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

				html += plugin.buildEstimatorHtml(player, history);
			}

			//score changes on the left, ship summary on the right
			html += "<div style='display:flex; flex-wrap:wrap; align-items:flex-start; gap:32px;'>";

			if (latest) {
				//most recent turns first, all turns in their own scroll area
				html += "<div><h3>Score changes</h3>";
				html += "<div id='BuildPredictScores' style='display:inline-block; overflow-y:auto;'><table class='BuildPredictTable' border='0'><thead><tr>" +
					"<th>Turn</th><th>Score</th><th>Military</th>" +
					"<th class='Narrow' title='Change against the previous turn; a rise is the minimum number built'>Warships</th>" +
					"<th class='Narrow' title='Change against the previous turn; a rise is the minimum number built'>Freighters</th><th>Ids first seen</th>" +
					"</tr></thead><tbody>";
				for (var t = 0; t < history.turns.length; t++) {
					var row = history.turns[t];
					html += "<tr style='color:" + color + "'>" +
						"<td>" + plugin.formatTurnRange(row) + "</td>" +
						"<td>" + row.score + plugin.formatChange(row.scoreChange) + "</td>" +
						"<td>" + row.military + plugin.formatChange(row.militaryChange) + "</td>" +
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
						"<td>" + plugin.escapeHtml(entry.ship.name) + "</td>" +
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
