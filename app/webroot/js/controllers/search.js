(function(){
	
	var _util = window.LSP.utilities;
	
	_util.register('controller', 'search', (function(){
		var _this = {};
		var _app = window.LSP;
		var _api = _app.models.easyask;

		var IS_SINGLE_SELECT = false;

		var _isFirstRequest = true;

		var _state = {
			resultsPerPage : '20',
			page : 'first',
			sort : 'default',
			category : '',
			allAttributes : ''
		};

		var _attributeHistory = []; // [{name : attributeName, state : 'temporary or static'}]

		// {sort, resultsPerPage, page, category, attributes ({thing : [thing1, thing2]}), keywords, action ('advisor'), method ('CA_Search')}

		_this = {
			events : {
				search : {
					// onBeforeAPICall : function(e, data){
					// 	_state.path = data.xhrData.data.CatPath;
					// 	_app.controllers.application.pushState(_this, _state);
					// },

					onBeforeAPICall : function(e, data){
						$('.page-search').addClass('loading');
					},
					
					onAfterAPICall : function(e, data){
						$('.page-search').removeClass('loading');
						_isFirstRequest = false;
					},

					onAfterAPICallSuccess : function(e, data){

						var navPathNodeList = data.response.source.navPath.navPathNodeList

						if(IS_SINGLE_SELECT){
							_state.category = navPathNodeList[navPathNodeList.length - 1].purePath || 'All Products';
						}else{
							// Remove everything except categories, then remove trailing /
							_state.category = (_api.getCategoriesFromSEOPath(navPathNodeList[navPathNodeList.length - 1].seoPath)).replace(/\/$/, '');
							_state.allAttributes = (_api.getRefinementsFromSEOPath(navPathNodeList[navPathNodeList.length - 1].seoPath)).replace(/\/$/, '');
							_state.keywords = (_api.getKeywordsFromSEOPath(navPathNodeList[navPathNodeList.length - 1].seoPath)).replace(/\/$/, '');
						}
						_state.page = ((data.response.source.products || {}).itemDescription || {}).currentPage;
						
						if(!data.xhrData.passthrough.isFromHistory){

							// If we don't scroll first - the scroll position will be saved
							// and you will jump around when clicking the back button
							$.when(_this.scrollToFirst()).done(function(){
								_this.pushState();
							});

						}
					},

					onAfterAPICallFailure : function(e, data){
						console.error('Network Error', data);
						_this.renderFatalError();
					},

					onRemoveFilter : function(e, data){
						
						if(IS_SINGLE_SELECT){
							_this.removePathNode('AttribSelect=' + $(data.selector).data('attribute') + ' = \'' + $(data.selector).data('value') + '\'');
						}else{
							_this.removeFilterAttribute($(data.selector).data('value'));
						}
						
					},

					onSearch : function(e, data){
						var query = $(data.selector).data('query');
						_this.search(query);
						$('#searchQuery').val(query).change();
					},

					onRemoveSearch : function(e, data){
						_this.search('');
						$('#searchQuery').val('').change();
					},

					onFilterAttribute : function(e, data){
						
						var name = $(data.selector).attr('name').replace('[]', '');

						if(IS_SINGLE_SELECT){
							_this.filterWithAttribute(name, $(data.selector).val());
						}else{

							// The basic idea here is, the first time you check a box it gets
							// added to the history, to account unchecking we make sure
							// all of the elements in history are present as checked boxes in the form

							// On the retuning request, the attributes will be marked as "static" or "temporary"
							// and will consequently be rendered differently.

							var formObject = _util.formToObject($('#refinementForm')[0]);

							// If it's not part of the history (first time it's been checked), add it to the history
							// We can rely on the fact that doing attribute 1, attribute 2, attribute 1 selection
							// paths will never happen because we will be hiding them

							// If we have unselected another attribute (different from the last selected) then we need to
							// mark the last selected as static. This solves the use case of selecting two "Color" then "Artist" then
							// unselecting a "Color" and "Artist" should "collapse" into it's static form 
							var isInHistory = $.grep(_attributeHistory, function(a){ return a.name === name; }).length
							if(!isInHistory){
								_attributeHistory.push({name : name, displayState : 'temporary'});
							}else if(_attributeHistory[_attributeHistory.length - 1].name !== name){
								_attributeHistory[_attributeHistory.length - 1].displayState = 'static';
							}

							// Mark everything not curent as static
							for(var i = 0; i < _attributeHistory.length - 1; i++){
								_attributeHistory[i].displayState = 'static';
							}

							// Clear unnessesary history elements
							for(var i = 0; i < _attributeHistory.length; i++){

								// Chop off the last two characters "[]"
								var attributeName = _attributeHistory[i].name;

								// If the history element isn't in the form it means nothing is selected for
								// that attribute any longer
								if(!formObject[attributeName]){
									_attributeHistory.splice(i, 1);
								}
							}

							if($(data.selector).is(':checked')){
								_this.addFilterAttribute($(data.selector).val());
							}else{
								_this.removeFilterAttribute($(data.selector).val());
							}
						}
						
					},

					onClearAllRefinements : function(e, data){

						_attributeHistory = [];
						_state.allAttributes = '';
						_state.keywords = '';
						_this.loadCategory(_state.category);

					},

					onLoadCategory : function(e, data){
						_this.loadCategory($(data.selector).data('path'), true);
					},

					onRemoveCategory : function(e, data){
						var path = '/' + _state.category;
						var categoriesToRemove = $(data.selector).data('removepath').split('/');

						// Loop through and remove the sub categories
						for(var i = 0; i < categoriesToRemove.length; i++){
							if(categoriesToRemove[i].length > 0){
								path = path.replace('/' + categoriesToRemove[i], ''); // Begins the phrase
							}
						}
						_this.loadCategory(path, true);

					},

					onNextPage : function(e, data){
						_this.paginate('next');
					},

					onPreviousPage : function(e, data){
						_this.paginate('prev');
					},

					onSort : function(e, data){
						_state.sort = $(data.selector).val();
						_this.paginate('first');
					},

					onItemsPerPage : function(e, data){
						_state.resultsPerPage = $(data.selector).val();
						_this.paginate('first');
					},

					onShowCompactView : function(e, data){
						_this.changeView('gridView');
						_this.pushState();
					},

					onShowDetailsView : function(e, data){
						_this.changeView('listView');
						_this.pushState();
					}
				},
				application : {

					onStateChange : function(e, data){
						_this.loadState(_app.controllers.application.pullState(_this), {isFromHistory : true});
					},

					onReady : function(e, data){
						_this.loadState(_app.controllers.application.pullState(_this));
					},
					
					onInit : function(e, data){

					}
				}
			},
			
			assets : {},

			getState : function(){
				return _state;
			},

			pushState : function(){

				var pushedState = $.extend({}, _state);
				
				delete pushedState.category; // Remove Category from the hash (it's being 'saved' in the URL)
				delete pushedState.keywords; // Hide keywords from hash as they are found in query parameter

				pushedState.allAttributes = {value : pushedState.allAttributes.replace(/\//g, '|'), uriEncode : false};
				pushedState.path = 'Categories/' + _state.category;

				if(pushedState.allAttributes.value.length === 0){
					delete pushedState.allAttributes;
				}

				// if isFirstRequest is true, then app.pushState will use history.replaceState instead
				return _app.controllers.application.pushState(_this, pushedState, _isFirstRequest);
			},

			pullState : function(state){
				
				state = state || {};

				state.allAttributes = ((state || {}).allAttributes || '').replace(/\|/g, '/');
				state.category = document.location.pathname.replace('/Categories/', '');

				$.extend(_state, state);

				return state;
			},

			loadState : function(state, passthrough){
				_this.pullState(_app.controllers.application.pullState(_this));
				_this.search('', passthrough);
				_this.changeView(_state.view);
			},

			// By keyword
			search : function(keywords, passthrough){

				var payload = {
					action : 'advisor',
					method : 'CA_Search',
					keywords : keywords
				};

				return _api.request(_this, 'search', $.extend({}, _state, {isSingleSelect : IS_SINGLE_SELECT}, payload), passthrough)
					.done(function(data){
						_this.renderPage(data.response.source);
					});
			},

			loadCategory : function(categoryPath, isAtomic){

				var payload = {
					action : 'advisor',
					method : 'CA_CategoryExpand',
					category : (isAtomic ? categoryPath : _state.category.replace(/\/$/, '') + '/' + categoryPath)
				};

				// TODO : rename path to addedPath or something similar

				return _api.request(_this, 'loadCategory', $.extend({}, _state, {isSingleSelect : IS_SINGLE_SELECT}, payload))
					.done(function(data){
						_this.renderPage(data.response.source);
					});
			},

			addFilterAttribute : function(attributeSlug){

				var payload = {
					action : 'advisor',
					method : 'CA_AttributeSelected',
					attribute : attributeSlug
				};

				return _api.request(_this, 'filter', $.extend({}, _state, {isSingleSelect : IS_SINGLE_SELECT}, payload))
					.done(function(data){
						_this.renderPage(data.response.source);
					});
			},

			removeFilterAttribute : function(attributeSlug){
				
				console.log('Removing ', attributeSlug, ' from ', _state.allAttributes);

				var payload = {
					action : 'advisor',
					method : 'CA_BreadcrumbRemove',
					allAttributes : _state.allAttributes.replace(attributeSlug, '').replace(/\/{1,}/, ';') // remove it, and remove leftover ;;
				};

				return _api.request(_this, 'removeFilter', $.extend({}, _state, {isSingleSelect : IS_SINGLE_SELECT}, payload))
					.done(function(data){
						_this.renderPage(data.response.source);
					});
			},

			// breadcrumbClick : function(bc){
			//	var request = {
			//		requestAction : 'advisor',
			//		requestData : 'CA_BreadcrumbClick'
			//	};
			//	//var url = formURL() + '&RequestAction=advisor&RequestData=CA_BreadcrumbClick&CatPath='+encodeURIComponent(bc);
			//	//invoke(url);
			// },

			// loadPage : function(pageName){
			// 	var payload = {
			// 		action : 'navbar',
			// 		method : 'page' + pageName
			// 	};

			// 	return _api.request(_this, 'loadPage', $.extend({}, _state, payload));
			// },

			// Direction can be [first, last, next, prev]
			paginate: function(direction){

				var payload = {
					action : 'navbar',
					method : ($.isNumeric(direction) ? 'page' + direction : direction),
					currentPage : _state.page
				};

				return _api.request(_this, 'paginate', $.extend({}, _state, payload))
					.done(function(data){
						_this.renderSummary(data.response.source);
						_this.renderProducts(data.response.source);
					});

			},

			// removePathNode : function(node){
				
			// 	var payload = {
			// 		category : _state.category.replace('////' + node, ''),
			// 		RequestAction : 'advisor',
			// 		RequestData : 'CA_BreadcrumbRemove'
			// 	};

			// 	return _api.request(_this, 'removeNode', payload)
			// 		.done(function(data){
			// 			_this.renderPage(data.response.source);
			// 		});
			// },

			changeView : function(viewType){
				if(viewType === 'gridView' || viewType === 'listView'){
					$('#resultsContainer')
						.removeClass('gridView')
						.removeClass('listView')
						.addClass(viewType);

					_state.view = viewType;
				}
			},

			renderPage : function(easyAskDataObject){

				// Render Sections
				_this.renderSummary(easyAskDataObject);
				_this.renderSelectedRefinements(easyAskDataObject);
				_this.renderRefinements(easyAskDataObject);
				_this.renderProducts(easyAskDataObject);

			},

			scrollToFirst : function(){
				// Scroll To Top
				var searchPage = $('.page-search');
				return _util.scrollTo(searchPage);
			},

			renderSummary : function(easyAskDataObject){

				var path = _state.category;
				var currentPageNumber = ((easyAskDataObject.products || {}).itemDescription || {}).currentPage;
				var totalPages = ((easyAskDataObject.products || {}).itemDescription || {}).pageCount;

				var breadcrumbHTML = _util.parseMicroTemplate('templates-search-breadcrumbs', $.extend({}, easyAskDataObject));
				_app.controllers.application.attachEvents($('#breadcrumbs').html(breadcrumbHTML));

				var titleHTML = _util.parseMicroTemplate('templates-search-title', $.extend({}, easyAskDataObject));
				_app.controllers.application.attachEvents($('#searchTitle').html(titleHTML));

				$('.currentPageNumber').html(currentPageNumber);
				$('.totalPages').html(totalPages);
				$('.numberOfResults').html(((easyAskDataObject.products || {}).itemDescription || {}).totalItems);

				$('select[data-action="sort"]').val(((easyAskDataObject.products || {}).itemDescription || {}).sortOrder);
				$('select[data-action="itemsPerPage"]').val(((easyAskDataObject.products || {}).itemDescription || {}).resultsPerPage);

				if(currentPageNumber === 1){
					$('*[data-action="previousPage"]').css('visibility', 'hidden');
				}else{
					$('*[data-action="previousPage"]').css('visibility', 'visible');
				}

				if(currentPageNumber === totalPages){
					$('*[data-action="nextPage"]').css('visibility', 'hidden');
				}else{
					$('*[data-action="nextPage"]').css('visibility', 'visible');
				}

				// Update Title
				var refinements = [];
				// Looping backwards so the refinements come out in a sort-of first-picked-first-in-list format
				for(var i = easyAskDataObject.navPath._lsp.refinementNodes.length - 1; i >= 0 ; i--){
					refinements.push(easyAskDataObject.navPath._lsp.refinementNodes[i].value);
				}
				document.title = (document.title.replace(/[\|:].*/, '') + (refinements.length ? ' : ' + refinements.join(', ') : '') + ' | Lone Star Percussion');

				

			},

			renderSelectedRefinements : function(easyAskDataObject){
				var selectedHTML = _util.parseMicroTemplate('templates-search-selectedRefinements', $.extend({}, easyAskDataObject));
				_app.controllers.application.attachEvents($('#selectedRefinements').html(selectedHTML));
			},


			renderRefinements : function(easyAskDataObject){

				// Mark attributes._lsp.cached attributes with _attributeHistory states
				// Loop through the history, then loop through the cached attributes
				// looking to find the entry, and mark it with the saved state
				for(var i = 0; i < _attributeHistory.length; i++){
					for(var j = 0; j < easyAskDataObject.attributes._lsp.cached.length; j++){
						var cachedAttribute = easyAskDataObject.attributes._lsp.cached[j];

						if((_attributeHistory[i] || {}).name === cachedAttribute.name){
							easyAskDataObject.attributes._lsp.cached[j].displayState = _attributeHistory[i].displayState;
							break;
						}
					}
				}

				var refinementHTML = _util.parseMicroTemplate('templates-search-refinements', $.extend({}, easyAskDataObject));
				_app.controllers.application.attachEvents($('#searchRefinements').html(refinementHTML).show());
				
			
			},

			renderProducts : function(easyAskDataObject){
				var entriesHTML = _util.parseMicroTemplate('templates-search-entries', $.extend({}, easyAskDataObject));
				_app.controllers.application.attachEvents($('#searchEntries').html(entriesHTML));
			},

			renderFatalError : function(){
				console.error('Fatal Error');
				// var errorHTML = _util.parseMicroTemplate('templates-error', {
				// 	title : 'Something Big Has Happened',
				// 	message : 'Sorry about that, but something has gone seriously wrong.'
				// });
				// _app.controllers.application.attachEvents($('.page-search').html(errorHTML));
			}
		};
		
		return _this;

	})());

})();