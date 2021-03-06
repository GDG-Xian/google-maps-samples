$(function() {
    var map, geocoder, directionDisplay, directionsService, curr_response;
    var $directions_navs = $('#directions_navs');
    var xian = new google.maps.LatLng(34.198564,108.895614);
    var defaultBounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(33.683211, 107.665192),  // 西南
      new google.maps.LatLng(34.782228, 109.752594)); // 东北
    
    var TPLS = {
        LOC: ''
            + '<li class="location-wrap"><label>经过</label>'
            + '  <input type="text" class="location waypoint" />'
            + '  <button type="button" class="close">×</button>'
            + '</li>',

        ROUTE: ''
            + '<li class="route clearfix"><a href="javascript:;">'
                + '<div class="route-mileage">'
                    + '<label class="label label-info">%{distance.text}</label>'
                + '</div>'
                + '<div class="route-addr">'
                    + '从 <strong>%{start_address}</strong><br />'
                    + '至 <strong>%{end_address}</strong>'
                + '</div>'
            + '</a></li>',

        NAVITEM: ''
            + '<li class="navitem">'
                + '<a href="javascript:;" data-index="%{1}">路线%{2}</a>'
            + '</li>'
    };

    function fmt() {
        var args = arguments;
        return args[0].replace(/%\{(.*?)}/g, function(match, prop) {
            return function(obj, props) {
                var prop = /\d+/.test(props[0]) ? parseInt(props[0]) : props[0];
                if (props.length > 1) {
                    return arguments.callee(obj[prop], props.slice(1));
                } else {
                    return (obj[prop] != undefined || obj[prop] != null) ? obj[prop] : '';
                }
            }(typeof args[1] === 'object' ? args[1] : args, prop.split(/\.|\[|\]\[|\]\./));
        });
    }

    function initialize() {
        directionsDisplay = new google.maps.DirectionsRenderer({ draggable: true });
        directionsService = new google.maps.DirectionsService();
        var map_options = {
            zoom: 15,
            center: xian,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        }
        map = new google.maps.Map($('#map-canvas').get(0), map_options);
        geocoder = new google.maps.Geocoder();
        directionsDisplay.setMap(map);
    }

    function execute_route() {
        var waypoints = [];
        var start_location = $('#start-location').val();
        var end_location   = $('#end-location').val();
        $('.waypoint').each(function() {
            var waypoint = this.value;
            if ($.trim(waypoint) !== '') {
                waypoints.push({ location: waypoint, stopover: true });
            }
        });

        var request = {
            origin: start_location,
            destination: end_location,
            waypoints: waypoints,
            optimizeWaypoints: true,
            provideRouteAlternatives: true,
            travelMode: google.maps.DirectionsTravelMode.DRIVING
        };
        directionsService.route(request, function(response, status) {
            console.log(response, status);
            $directions_navs.empty();
            if (status === google.maps.DirectionsStatus.OK) {
                curr_response = response;
                for (var i = 0; i < response.routes.length; i++) {
                    var navitem_html = fmt(TPLS.NAVITEM, i, i + 1);
                    $directions_navs.append(navitem_html);    
                }

                $('#directions_navs .navitem:eq(0)').addClass('active');
                display_route(curr_response, 0);
            }
        });
    }

    function fix_zip(addr) {
        return addr.replace(/\s*邮政编码\:.*/ig, '');
    }

    function display_route(response, route_index) {
        directionsDisplay.setDirections(response);
        directionsDisplay.setRouteIndex(route_index);
        var route = response.routes[route_index];
        // For each route, display summary information.
        var html = $.map(route.legs, function(leg) {
            leg.start_address = fix_zip(leg.start_address);
            leg.end_address   = fix_zip(leg.end_address);
            return fmt(TPLS.ROUTE, leg); 
        }).join('');
        $('#directions_panel').html(html);
    }

    function bind_typeahead($location) {
        $location.each(function() {
            new google.maps.places.Autocomplete(this, { bounds: defaultBounds });
        });
    }
    bind_typeahead($('.location'));

    $('#add-stop-location').click(function() {
        $stop = $(TPLS.LOC); 
        $('#stop-locations').append($stop);
        bind_typeahead($stop.find('.location'));
        $stop.find('.close').click(function() {
            $(this).parents('.location-wrap').remove();
        });
    });

    $('#btn-route').click(execute_route);
    
    $('#directions_navs .navitem a').live('click', function() {
        $('#directions_navs .navitem').removeClass('active');
        
        var $this = $(this);
        $this.parent().addClass('active');
        var index = parseInt($this.data('index'));
        display_route(curr_response, index);
    });
    initialize();
});
