

(function(app) {
	
	function querySelector(selector, $context) {
		return ($context || document).querySelector(selector);
	}
	
	function createElement(tagName, className, $appendTo, html) {
		var $elem = document.createElement(tagName);
		className != null && ($elem.className = className);
		$appendTo && $appendTo.appendChild($elem);
		html != null && ($elem.innerHTML = html);
		return $elem;
	}
	
	function createControl(modifiers, $appendTo, title) {
		var $btn = createElement('div', cls.apply(null, ('control_'+modifiers.join(' control_')).split(' ').concat('control')), $appendTo);
		title != null && $btn.setAttribute('title', title);
		return $btn;
	}
	
	
	function dBlock($elem) {
		$elem.style.display = "block";
	}
	
	function dNone($elem) {
		$elem.style.display = "none";
	}
	
	
	function cls(className) {
		for (var res = [], i = 0; i < arguments.length; i++) {
			res.push(CLS_MAIN+'-'+arguments[i]);
		}
		return res.join(' ');
	}
	
	
	
	var CLS_MAIN = 'e-FastReader',
		
		LNG_LOADING         = "Loading ...",
		LNG_TAP_TO_START    = "Click the screen or press space bar to start.",
		
		MIN_WPM     = 50,
		MAX_WPM     = 2000,
		WPM_STEP    = 50,
		
		MIN_FONT    = 1,
		MAX_FONT    = 7,
		
		$body = querySelector('body');
	
	
	app.Reader = function(parser) {
		
		function next(justRun) {
			clearTimeout(timeout);
			
			if (!isRunning) return;
			
			var newData = justRun && data || parser.nextWord();
			if (newData) {
				data = newData;
				updateWord();
				timeout = setTimeout(next, justRun ? 500 : (60000/app.get('wpm'))*(data.isDelayed && app.get('smartSlowing') ? 2 : 1));
			}
			else {
				api.stop();
			}
		}
		
		
		function updateWrapper() {
			$wrapper.setAttribute('is-running', isRunning);
			$wrapper.setAttribute('dark-theme', app.get('darkTheme'));
			$wrapper.setAttribute('font-size', app.get('fontSize'));
			$wrapper.setAttribute('focus-mode', app.get('focusMode'));
		}
		
		function updatePanels() {
			$wpmText.innerHTML = app.get('wpm')+'wpm';
		}
		
		function updateContext() {
			if (data) {
				$contextBefore.innerHTML = parser.text.substring(0, data.start);
				$contextAfter.innerHTML = parser.text.substring(data.end);
			}
		}
		
		function updateWord() {
			var word = data.word;
			
			$word.style.left = '';
			
			if (app.get('focusMode')) {
				var stop = Math.round((word.length+1)*0.4) - 1;
				$word.innerHTML = word.substring(0, stop)+'<span>'+word[stop]+'</span>'+word.substring(stop+1);
				
				var letterRect = $word.querySelector('span').getBoundingClientRect();
				$word.style.left = Math.round(focusPoint - letterRect.left - letterRect.width/2)+'px';
			}
			else {
				$word.innerHTML = word;
			}
		}
		
		function updateFocusPoint() {
			var rect = $focusDashes.getBoundingClientRect();
			focusPoint = Math.floor(rect.left + Math.floor(rect.width)/2);
		}
		
		
		function onStartCtrl() {
			isRunning ? api.stop() : api.start();
		}
		
		function onNextWordCtrl() {
			isRunning && api.stop();
			
			dNone($info);
			
			var newData = parser.nextWord();
			if (newData) {
				data = newData;
				updateWord();
				updateContext();
			}
		}
		
		function onPrevWordCtrl() {
			isRunning && api.stop();
			
			dNone($info);
			
			var newData = parser.prevWord();
			if (newData) {
				data = newData;
				updateWord();
				updateContext();
			}
		}
		
		function onNextSentenceCtrl() {
			isRunning && api.stop();
			
			dNone($info);
			
			var newData = parser.nextSentense() || parser.lastWord();
			if (newData) {
				data = newData;
				updateWord();
				updateContext();
			}
		}
		
		function onPrevSentenceCtrl() {
			isRunning && api.stop();
			
			dNone($info);
			
			var newData = parser.prevSentense() || parser.firstWord();
			if (newData) {
				data = newData;
				updateWord();
				updateContext();
			}
		}
		
		function onLastWordCtrl() {
			isRunning && api.stop();
			
			dNone($info);
			
			var newData = parser.lastWord();
			if (newData) {
				data = newData;
				updateWord();
				updateContext();
			}
		}
		
		function onFirstWordCtrl() {
			isRunning && api.stop();
			
			dNone($info);
			
			var newData = parser.firstWord();
			if (newData) {
				data = newData;
				updateWord();
				updateContext();
			}
		}
		
		
		function onIncreaseWpmCtrl() {
			app.set('wpm', Math.min(app.get('wpm')+WPM_STEP, MAX_WPM));
			updatePanels();
		}
		
		function onDecreaseWpmCtrl() {
			app.set('wpm', Math.max(app.get('wpm')-WPM_STEP, MIN_WPM));
			updatePanels();
		}
		
		
		function onIncreaseFontCtrl() {
			app.set('fontSize', Math.min(app.get('fontSize')+1, MAX_FONT));
			updateWrapper();
			updateFocusPoint();
			updateWord();
		}
		
		function onDecreaseFontCtrl() {
			app.set('fontSize', Math.max(app.get('fontSize')-1, MIN_FONT));
			updateWrapper();
			updateFocusPoint();
			updateWord();
		}
		
		
		function onWindowResize() {
			updateFocusPoint();
		}
		
		function onKeydown(e) {
			switch (e.keyCode) {
				case 32: // space
					app.stopEvent(e);
					onStartCtrl();
					break;
				case 39: // right
					app.stopEvent(e);
					e.ctrlKey
						? onNextSentenceCtrl()
						: e.altKey ? onLastWordCtrl() : onNextWordCtrl();
					break;
				case 37: // left
					app.stopEvent(e);
					e.ctrlKey
						? onPrevSentenceCtrl()
						: e.altKey ? onFirstWordCtrl() : onPrevWordCtrl();
					break;
				case 38: // up
					app.stopEvent(e);
					e.ctrlKey ? onIncreaseFontCtrl() : onIncreaseWpmCtrl();
					break;
				case 40: // down
					app.stopEvent(e);
					e.ctrlKey ? onDecreaseFontCtrl() : onDecreaseWpmCtrl();
					break;
			}
		}
		
		
		
		var api = this,
			isRunning = false,
			
			$wrapper            = createElement('div', cls('wrapper'), $body),
			
			$contextBefore      = createElement('div', cls('context', 'context_before'), $wrapper),
			$contextAfter       = createElement('div', cls('context', 'context_after'), $wrapper),
			
			$wordWrap           = createElement('div', cls('wordWrap'), $wrapper),
			$word               = createElement('div', cls('word'), $wordWrap),
			$focusLines         = createElement('div', cls('focusLines'), $wordWrap),
			$focusDashes        = createElement('div', cls('focusDashes'), $wordWrap),
			
			$info               = createElement('div', cls('info'), $wrapper, LNG_LOADING),
			
			$sensor             = createElement('div', cls('sensor'), $wrapper),
			
			$panelTop           = createElement('div', cls('panel', 'panel_top'), $wrapper),
			
			$fontAdjust         = createElement('div', cls('adjuster', 'adjuster_font'), $panelTop, '<span>aA</span>'),
			$ctrlDecFont        = createControl(['minus'], $fontAdjust),
			$ctrlIncFont        = createControl(['plus'], $fontAdjust),
			
			$wpmAdjust          = createElement('div', cls('adjuster', 'adjuster_wpm'), $panelTop),
			$wpmText            = createElement('span', null, $wpmAdjust),
			$ctrlDecWpm         = createControl(['minus'], $wpmAdjust),
			$ctrlIncWpm         = createControl(['plus'], $wpmAdjust),
			
			$panelBot           = createElement('div', cls('panel', 'panel_bottom'), $wrapper),
			$ctrlStart          = createControl(['start'], $panelBot),
			$ctrlNextWord       = createControl(['nextWord'], $panelBot),
			$ctrlNextSentence   = createControl(['nextSentence'], $panelBot),
			$ctrlLastWord       = createControl(['lastWord'], $panelBot),
			$ctrlPrevWord       = createControl(['prevWord'], $panelBot),
			$ctrlPrevSentence   = createControl(['prevSentence'], $panelBot),
			$ctrlFirstWord      = createControl(['firstWord'], $panelBot),
			
			focusPoint = 0,
			bodyOverflowBefore = $body.style.overflow,
			data, timeout;
		
		
		$body.style.overflow = "hidden";
		
		
		api.start = function() {
			if (isRunning) return;
			isRunning = true;
			
			dNone($contextBefore);
			dNone($contextAfter);
			dNone($info);
			dNone($panelTop);
			dNone($panelBot);
			
			updateWrapper();
			
			next(true);
		}
		
		api.stop = function() {
			clearTimeout(timeout);
			
			if (!isRunning) return;
			isRunning = false;
			
			updateWrapper();
			updateContext();
			
			dBlock($contextBefore);
			dBlock($contextAfter);
			dBlock($panelTop);
			dBlock($panelBot);
		}
		
		api.destroy = function() {
			app.off(window, 'resize', onWindowResize);
			app.off(window, "keydown", onKeydown);
			
			$body.removeChild($wrapper);
			$body.style.overflow = bodyOverflowBefore;
		}
		
		
		api.onPopupSettings = function(key, value) {
			switch (key) {
				case 'darkTheme':
					updateWrapper();
					break;
				case 'focusMode':
					updateWrapper();
					updateFocusPoint();
					updateWord();
					break;
				case 'entityAnalysis':
					parser.parse();
					data = parser.wordAtIndex(data.start+1);
					updateWord();
					updateContext();
					break;
			}
		}
		
		
		parser.parse();
		
		
		updateWrapper();
		updateFocusPoint();
		
		dBlock($panelTop);
		dBlock($panelBot);
		updatePanels();
		
		$info.innerHTML = LNG_TAP_TO_START;
		
		
		app.on($sensor, "click", onStartCtrl);
		
		app.on($ctrlStart, "click", onStartCtrl);
		app.on($ctrlNextWord, "click", onNextWordCtrl);
		app.on($ctrlNextSentence, "click", onNextSentenceCtrl);
		app.on($ctrlLastWord, "click", onLastWordCtrl);
		app.on($ctrlPrevWord, "click", onPrevWordCtrl);
		app.on($ctrlPrevSentence, "click", onPrevSentenceCtrl);
		app.on($ctrlFirstWord, "click", onFirstWordCtrl);
		
		app.on($ctrlDecWpm, "click", onDecreaseWpmCtrl);
		app.on($ctrlIncWpm, "click", onIncreaseWpmCtrl);
		
		app.on($ctrlDecFont, "click", onDecreaseFontCtrl);
		app.on($ctrlIncFont, "click", onIncreaseFontCtrl);
		
		app.on(window, 'resize', onWindowResize);
		app.on(window, "keydown", onKeydown);
		
	};
	
	
})(window.fastReader);
