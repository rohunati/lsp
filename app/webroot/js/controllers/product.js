(function(){
	
	var _util = window.LSP.utilities;
	
	var product = (function(){
		var _this = {};
		var _app = window.LSP;
		var _assets = _app.assets;
		var _api = _app.models.easyask;
		
		_this =  {
			events : {
				product : {
					onAddToCart : function(e, data){
						_this.updateProduct(data.selector); // Update the product, just to be safe.
						data.selector[0].submit();
					},
					onMatrixOptionSelect : function(e, data){
						_this.updateMatrixLists(data.selector[0].form);
					}
				},
				application : {
					onReady : function(e, data){
						
						var productPageForm = $('.page-product form[action="/app/site/backend/additemtocart.nl"]')[0];
						if(productPageForm){
							_this.renderMatrixLists(productPageForm);
						}

						setTimeout(_this.removeEmptySpecificationsRows, 500);

						if($('.page-productDetail .audio.section').is(':not(.show0Elements)')){
							head.js(
								'http://dev.lonestarpercussion.com/js/vendors/soundmanager2/script/soundmanager2.js',
								'http://dev.lonestarpercussion.com/js/vendors/360player/animator.js',
								'http://dev.lonestarpercussion.com/js/vendors/360player/360player.js',
								'http://dev.lonestarpercussion.com/js/vendors/360player/360player.css', function(){
									soundManager.setup({
										// path to directory containing SM2 SWF
										url: 'http://dev.lonestarpercussion.com/js/vendors/soundmanager2/swf/'
									});
							});
						}
						
					},
					onInit : function(e, data){}
				}
			},
			
			assets : {},

			removeEmptySpecificationsRows : function(){
				$('tr[data-specifications-data*="!empty!"], tr[data-specifications-data*="!Unknown!"], tr[data-specifications-data*="!None!"]').remove();
			},

			renderMatrixLists : function(form){
				
			},

			updateMatrixLists : function(form){

				var easyAskMatrixData = _api.parseMatrixChildren($('div[data-name="summaryString"]', form).data('value'));
				var selectedOptions = {};

				// Create an object of currently selected options
				$('select', form)
					.each(function(i, element){
						// If it's not the 'Select an Option' choice - which is identified by value=''
						if($(element).val().length){
							selectedOptions[$(element).attr('name')] = $(element).val();
						}
					});

				// Filter, and render newly updated options
				var filteredOptions = _api.filterMatrixChildren(easyAskMatrixData, selectedOptions)
				var unselectedOptionText = $('option[value=""]:first', form).text();
		
				$.each(filteredOptions, function(label, options){
					
					var optionHTML = '<option value="">'+ unselectedOptionText +'</option>';

					$.each(options, function(value, noop){
						optionHTML += '<option value="' + value + '" '+ ((selectedOptions[label] === value) ? 'selected' : '') +'>'+value+'</option>';
					});

					// Update everything except the one you are currently on.					
					$('select[name="'+ label + '"]', form).html(optionHTML);
				});

				_this.updateProduct(form);
			},
			
			updateProduct : function(form){

				var easyAskMatrixData = _api.parseMatrixChildren($('div[data-name="summaryString"]', form).data('value'));
				var selectedOptions = {};

				// Create an object of selected options to test against the formattedObject (the source)
				$('select', form)
					.each(function(i, element){
						selectedOptions[$(element).attr('name')] = $(element).val();
					});
				
				$('button.b1', form).attr('disabled', true);

				// Loop through the formattedMatrix (source of all attributes) and if we find an id that
				// matches the filter criteria, then set the id
				$.each(easyAskMatrixData.products, function(id, productData){
					for(var label in productData.options){
						// If it's not present, or if it exists, but is another value
						if(!selectedOptions[label] || selectedOptions[label] !== productData.options[label])
							return;
					}


					var entry = $(form).parents('.entry');
					// If we've made it here, it's because we've found an ID that matches the filters
					// Update all the changing nick nacks in the item listing
					$('input[name="buyid"]', entry).val(id); // Set the buyid
					$('button.b1', form).removeAttr('disabled');

					// "You save $x" - we hide it if the save amount is < 0 (it would be an error, so this is just to be safe)
					if(productData.data.msrp - productData.data.onlinePrice <= 0){
						$('.price .details', entry).hide();
					}else{
						$('.price .details', entry).show();
					}

					$('.productPrice', entry).html(_util.parseCurrency(productData.data.onlinePrice));
					$('.productMpn', entry).html(productData.data.mpn);
					$('.productDiscount', entry).html(_util.parseCurrency(productData.data.msrp - productData.data.onlinePrice));

					var optionArray = [];
					for(var label in productData.options){
						if(productData.options.hasOwnProperty(label)){
							optionArray.push(productData.options[label]);
						}
					}

					$('.productName .options', entry).html(' : ' + optionArray.join(', '));

					var size = $('.thumbnail img, #zoom-mainImage img', entry).width();
					$('.thumbnail img, #zoom-mainImage img', entry).attr('src', productData.data.imageUrl + '.' + size + 'x' + size);

					$('.productAvailability', entry).html(productData.data.stockMessage);

				})
			},
			
			// Returns product specs
			getSpecifications : function(id){
				return _api.request(_this, 'getSpecifications', 'getSpecifications', {id : id});
			},
			
			// Returns an object of options
			getMatrixOptions : function(matrixParentId){
				return _api.request(_this, 'get', 'getMatrixOptions', {parentId : matrixParentId});
			}
		};
		
		return _this;
	})();
	
	_util.register('controller', 'product', product);

})();