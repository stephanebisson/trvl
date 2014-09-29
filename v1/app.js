angular.module('app', [])
	.run(function($rootScope) {
		$rootScope.itinerary = {
			startCity: 'Toronto, Canada',
			regionToVisit: 'Spain',
			places: [{city: 'Madrid'}, {city: 'Toledo'}, {city: 'Tarragona'}, {city: 'Barcelona'}]
		};
	})
	.factory('googleMaps', function($q) {
		var geocoder = new google.maps.Geocoder();
		return {
			geocode: function(address, country) {
				var request = {address: address};
				if (country) {
					request.componentRestrictions = {country: country};
				}
				var deferred = $q.defer();
				geocoder.geocode(request, function(results, status) {
					console.log('geocoding', address, country, status, results[0]);
					if (status == google.maps.GeocoderStatus.OK) {
						var arg = {location: results[0].geometry.location, detail: results[0]};
						deferred.resolve(arg);
					} else {
						deferred.reject(status);
					}
				});
				return deferred.promise;
			},
			addMarker: function(location) {

			},
			clearMarkers: function() {

			}
		};
	})
	.factory('mapPresenter', function() {
		var map;
		return {
			init: function(element) {},
			highlightCountry: function(name) {},
			setHome: function() {}
		};
	})
	.controller('mapController', function($scope, $element, googleMaps) {
		var mapOptions = {
			zoom: 3
		};
		var map = new google.maps.Map($element[0], mapOptions);

		var startCityMarker;

		var setStartCity = function(cityName) {
			if (!cityName) return;

			googleMaps.geocode(cityName).then( 
				function(result) {
					if (startCityMarker) {
						startCityMarker.setMap(null);
					}

					startCityMarker = new google.maps.Marker({
							map: map,
							position: result.location
					});
				},
				function(error) {
					console.log('Geocode was not successful for the following reason: ' + error);
				}); 
		};

		var countryLayer;

		var setRegionToVisit = function(region) {
			// console.log('setRegionToVisit', arguments);

			if (countryLayer) {
				countryLayer.setMap(null);
			}
			
			if (!region) return;

			countryLayer = new google.maps.FusionTablesLayer({
			  query: {
			    select: 'geometry',
			    from: '1N2LBk4JHwWpOY4d9fobIn27lfnZ5MDy-NoqqRpk',
			    where: "Name = '" + region + "'"
			  },
			  map: map,
			  suppressInfoWindows: true,
			  styles: [{
			  			  	polygonOptions: {
			  			  		fillColor: 'FFFFFF',
			  			  		fillOpacity: 0.3,
			  			  		strokeColor: 'CCFF00',
			  			  		strokeOpacity: 0.9,
			  			  		strokeWeight: 3
			  			  	}
			  			  }]
			});

			googleMaps.geocode(region).then(function(result) {
				console.log('the country is', result.detail);
				$scope.itinerary.regionToVisitShortName = result.detail.address_components[0].short_name;
				map.setCenter(result.location);
				map.setZoom(6);
				// map.fitBounds(result.detail.geometry.bounds);
			});

		};

		var itineraryMarkers;

		var setItinerary = function(places) {
			if (!places) return;

			if (itineraryMarkers) {
				angular.forEach(itineraryMarkers, function(m) { m.setMap(null); });
			}
			itineraryMarkers = [];

			angular.forEach(places, function(place) {
				if (!place || place == '') return;

				googleMaps.geocode(place.city, $scope.itinerary.regionToVisitShortName).then(
					function(result) {
						var cityMarker = new google.maps.Marker({
								map: map,
								position: result.location,
								title: place.city
						});
						itineraryMarkers.push(cityMarker);
					},
					function(error) {
						console.log('Geocode was not successful for the following reason: ' + error);
					});
			});
		};

		$scope.$watch('itinerary.startCity', setStartCity);

		$scope.$watch('itinerary.regionToVisit', setRegionToVisit);

		$scope.$watch('itinerary.places', setItinerary, true);
	})
	.directive('map', function() {
		return {
			restrict: 'E',
			replace: true,
			scope: {
				itinerary: '='
			},
			controller: 'mapController',
			template: '<div class="map-canvas"></div>'
		};
	})
	.controller('podController', function($scope) {
		$scope.expanded = true;
	})
	.directive('pod', function() {
		return {
			restrict: 'E',
			replace: true,
			transclude: true,
			scope: {title: '@'},
			controller: 'podController',
			templateUrl: 'pod.html'
		};
	})
	.directive('placeAutocomplete', function() {
		return {
			require: 'ngModel',
			restrict: 'A',
			scope: {
				country: '='
			},
			link: function(scope, element, attributes, model) {
				var types = {
					city: '(cities)',
					region: '(regions)'
				};
				
				var options = { types: [types[attributes.placeAutocomplete]] };
				if (scope.country) {
					// console.log('country is', scope.country);
					options.componentRestrictions = {country: scope.country};
				}

				var autocomplete = new google.maps.places.Autocomplete(element[0], options);

				google.maps.event.addListener(autocomplete, 'place_changed', function() {
	                scope.$apply(function() {
	                    model.$setViewValue(element.val());                
	                });
	            });
			}
		};
	});











