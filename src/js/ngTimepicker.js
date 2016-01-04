angular.module('jkuri.timepicker', [])

.directive('ngTimepicker', ['$document','$timeout', function($document,$timeout) {

	var setScopeValues = function (scope, attrs) {
		scope.initTime = attrs.initTime || '11:00';
		scope.step = attrs.step || '15';
		scope.showMeridian = scope.$eval(attrs.showMeridian) || false;
		scope.meridian = attrs.meridian || 'AM';
		scope.theme = attrs.theme || '';
		scope.errors = [];
		scope.errorText = '';
		scope.showErrors = false;
		scope.minKey = attrs.minKey || '';
		scope.maxKey = attrs.maxKey || '';
		scope.uniqueId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		    var r = crypto.getRandomValues(new Uint8Array(1))[0]%16|0, v = c == 'x' ? r : (r&0x3|0x8);
		    return v.toString(16);
		});
	};

	return {
		restrict: 'EA',
		scope: {
          executeOnChange: '&',
          isDisabled: '=',
          minTime: '=',
          maxTime: '=',
          errorObject: '='
        },
		require: '?ngModel',
		link: function (scope, element, attrs, ngModel) {
			setScopeValues(scope, attrs);

			scope.opened = false;

			

			var initTime = function () {
				var time = scope.initTime.split(':');
				scope.hour = time[0];
				scope.minutes = time[1];
				scope.trueHour = (scope.showMeridian) ? convertFromMeridianHour() : scope.hour;
				initialValidate();
			};

			var setTime = function (init) {
				var time;
				if (!scope.showMeridian) {
					time = scope.hour + ':' + scope.minutes;
					scope.viewValue = time;
					scope.trueHour = scope.hour;
					ngModel.$setViewValue(time);
				} else {
					time = scope.hour + ':' + scope.minutes;
					scope.viewValue = time + ' ' + scope.meridian;
					time = convertFromMeridianHour() + ':' + scope.minutes;
					scope.trueHour = convertFromMeridianHour();
					ngModel.$setViewValue(time);
				}
				if(!init){
					validateTime();
					scope.executeOnChange();
				}
			};

			var setWatches = function(){
				scope.$watch('minTime', function() {
				   validateTime();
				});

				scope.$watch('maxTime', function() {
				   validateTime();
				});
			}

			var initialValidate = function(){
				// watches timepicker width in order to set tooltips after load
				var unbindWatch = scope.$watch(
				    function () { 
				        return {
				           width: element[0].querySelector('input').offsetWidth
				        }
					},
					function (obj) {
						console.log(obj.width);
						if( obj.width > 0 ){
							setWatches();
							unbindWatch();
						}
					},
					true //deep watch
				);
			}

			var validateTime = function(){
				scope.errors = [];
				scope.errorObject[scope.uniqueId] = [];
				scope.showErrors = false;
				if(scope.minTime){
					scope.minHour = parseInt(scope.minTime.split(':')[0], 10);
					scope.minMin = parseInt(scope.minTime.split(':')[1], 10);
					if( (scope.minHour > parseInt(scope.trueHour, 10))
						|| (scope.minHour == parseInt(scope.trueHour, 10) && scope.minMin > parseInt(scope.minutes, 10)) ){
						scope.errors.push("Time must be greater than " + scope.minKey + " (" + scope.minTime + ")");
						scope.errorObject[scope.uniqueId].push("Time must be greater than " + scope.minKey + " (" + scope.minTime + ")");
						scope.showErrors = true;
					}
				}

				if(scope.maxTime){
					scope.maxHour = parseInt(scope.maxTime.split(':')[0], 10);
					scope.maxMin = parseInt(scope.maxTime.split(':')[1], 10);
					if( (scope.maxHour < parseInt(scope.trueHour, 10))
						|| (scope.maxHour == parseInt(scope.trueHour, 10) && scope.maxMin < parseInt(scope.minutes, 10)) ){
						scope.errors.push("Time must be less than " + scope.maxKey + " (" + scope.maxTime + ")");
						scope.errorObject[scope.uniqueId].push("Time must be less than " + scope.maxKey + " (" + scope.maxTime + ")");
						scope.showErrors = true;
					}
				}
				scope.errorText = scope.errors.join(" AND ");
			}

			var convertFromMeridianHour = function () {
				var hour = parseInt(scope.hour, 10);
				
				if (scope.hour === 12 && scope.meridian === 'PM') return 12;
				if (scope.hour === 12 && scope.meridian === 'AM') return '00';

				if (scope.meridian === 'PM') {
					return hour + 12;
				} else {
					if (parseInt(hour, 10) < 10) {
						return '0' + hour;
					} else {
						return hour;
					}
				}
			};

			var reinitTime = function () {
				var time = scope.initTime.split(':');
				scope.hour = time[0];
				scope.minutes = time[1];

				time = scope.hour + ':' + scope.minutes;
				scope.viewValue = time;
				ngModel.$setViewValue(time);
			};

			scope.showTimepicker = function () {
				scope.opened = true;
			};

			scope.incrementHour = function () {
				if (!scope.showMeridian) {
					if (parseInt(scope.hour, 10) < 23) {
						scope.hour = parseInt(scope.hour, 10) + 1;
					} else {
						scope.hour = 0;
					}
				} else {
					if (parseInt(scope.hour, 10) < 12) {
						scope.hour = parseInt(scope.hour, 10) + 1;
					} else if (parseInt(scope.hour, 10) === 12) {
						scope.hour = 1;
						scope.toggleMeridian();
					}
				}

				if (parseInt(scope.hour, 10) < 10) {
					scope.hour = '0' + scope.hour;
				}

				setTime(false);
			};

			scope.decreaseHour = function () {
				if (!scope.showMeridian) {
					if (parseInt(scope.hour, 10) === 0) {
						scope.hour = 23;
					} else {
						scope.hour = parseInt(scope.hour, 10) - 1;
					}
				} else {
					if (parseInt(scope.hour, 10) === 0) {
						scope.hour = 12;
						scope.toggleMeridian();
					} else {
						scope.hour = parseInt(scope.hour, 10) - 1;
					}
				}

				if (parseInt(scope.hour, 10) < 10) {
					scope.hour = '0' + scope.hour;
				}

				setTime(false);
			};

			scope.incrementMinutes = function () {
				scope.minutes = parseInt(scope.minutes, 10) + parseInt(scope.step, 10);
				if(parseInt(scope.minutes, 10) > 0 && parseInt(scope.minutes, 10) < 10){
					scope.minutes = '0'+scope.minutes;
				}
				if (scope.minutes > 59) {
					scope.minutes = '00';
					scope.incrementHour();
					setTime(true);
				}else{
					setTime(false);
				}

			};

			scope.decreaseMinutes = function () {
				scope.minutes = parseInt(scope.minutes, 10) - parseInt(scope.step, 10);
				if(parseInt(scope.minutes, 10) > 0 && parseInt(scope.minutes, 10) < 10){
					scope.minutes = '0'+scope.minutes;
				}
				if (parseInt(scope.minutes, 10) === 0) {
					scope.minutes = '00';
				}
				if (parseInt(scope.minutes, 10) < 0) {
					scope.minutes = 60 - parseInt(scope.step, 10);
					scope.decreaseHour();
					setTime(true);
				}else{
					setTime(false);
				}
			};

			scope.toggleMeridian = function () {
				scope.meridian = (scope.meridian === 'AM') ? 'PM' : 'AM';
				setTime(false);
			};

			$document.on('click', function (e) {
				if (element !== e.target && !element[0].contains(e.target)) {
				    scope.$apply(function () {
				        scope.opened = false;
				    });
				}
            });

			initTime();
			setTime(true);

		},
		template:
		'<span></span>'+
		'<input type="text" tooltip-placement="top" uib-tooltip="{{errorText}}" tooltip-trigger="none" tooltip-is-open="showErrors" ng-focus="showTimepicker()" ng-value="viewValue" class="ng-timepicker-input" ng-class="{\'ng-timepicker-disabled\': isDisabled, \'has-error\': errors.length > 0}" ng-readonly="true">' +
		'<div class="ng-timepicker" ng-if="!isDisabled" ng-show="opened" ng-class="{\'red\': theme === \'red\', \'green\': theme === \'green\', \'blue\': theme === \'blue\'}">' +
		'  <table>' +
		'    <tbody>' +
		'    <tr>' +
		'        <td class="act noselect" ng-click="incrementHour()"><i class="fa fa-angle-up"></i></td>' + 
		'        <td></td>' +
		'        <td class="act noselect" ng-click="incrementMinutes()"><i class="fa fa-angle-up"></i></td>' +
		'        <td class="act noselect" ng-click="toggleMeridian()" ng-show="showMeridian"><i class="fa fa-angle-up"></i></td>' +
		'      </tr>' +
		'      <tr>' +
		'        <td><input type="text" ng-model="hour" ng-readonly="true"></td>' +
		'        <td>:</td>' +
		'        <td><input type="text" ng-model="minutes" ng-readonly="true"></td>' +
		'        <td ng-show="showMeridian"><input type="text" ng-model="meridian" ng-readonly="true"></td>' +
		'      </tr>' +
		'      <tr>' +
		'        <td class="act noselect" ng-click="decreaseHour()"><i class="fa fa-angle-down"></i></td>' + 
		'        <td></td>' +
		'        <td class="act noselect" ng-click="decreaseMinutes()"><i class="fa fa-angle-down"></i></td>' +
		'        <td class="act noselect" ng-click="toggleMeridian()" ng-show="showMeridian"><i class="fa fa-angle-down"></i></td>' +
		'      </tr>' +
		'  </table>' +
		'</div>'
	};

}]);