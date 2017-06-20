/**
 * Created by tp on 2016/7/18.
 */
$(function () {
    var data = [], totalPoints = 100;

    function getRandomData() {
        if (data.length > 0)
            data = data.slice(1);
        // Do a random walk
        while (data.length < totalPoints) {
            var prev = data.length > 0 ? data[ data.length - 1 ] : 50,
                y = prev + Math.random() * 10 - 5;

            if (y < 0) {
                y = 0;
            } else if (y > 100) {
                y = 100;
            }
            data.push(y);
        }

        // Zip the generated y values with the x values
        var res = [];
        for (var i = 0; i < data.length; ++i) {
            res.push([ i, data[ i ] ]);
        }

        return res;
    }

    var interactive_plot = $.plot("#interactive", [ getRandomData() ], {
        grid: {
            borderColor: "#f3f3f3",
            borderWidth: 1,
            tickColor: "#f3f3f3"
        },
        series: {
            shadowSize: 0, // Drawing is faster without shadows
            color: "#3c8dbc"
        },
        lines: {
            fill: true, //Converts the line chart to area chart
            color: "#3c8dbc"
        },
        yaxis: {
            min: 0,
            max: 100,
            show: true
        },
        xaxis: {
            show: true
        }
    });

    var updateInterval = 500; //Fetch data ever x milliseconds
    var realtime = "on"; //If == to on then fetch data every x seconds. else stop fetching
    function update() {

        interactive_plot.setData([ getRandomData() ]);

        // Since the axes don't change, we don't need to call plot.setupGrid()
        interactive_plot.draw();
        if (realtime === "on")
            setTimeout(update, updateInterval);
    }

    //INITIALIZE REALTIME DATA FETCHING
    if (realtime === "on") {
        update();
    }

    //REALTIME TOGGLE
    $("#realtime .btn").click(function () {
        if ($(this).data("toggle") === "on") {
            realtime = "on";
        }
        else {
            realtime = "off";
        }
        update();
    });
    /*
     * END INTERACTIVE CHART
     */


    /*
     * LINE CHART
     * ----------
     */
    //LINE randomly generated data

    var sin = [], cos = [];
    for (var i = 0; i < 14; i += 0.5) {
        sin.push([ i, Math.sin(i) ]);
        cos.push([ i, Math.cos(i) ]);
    }
    var line_data1 = {
        data: sin,
        color: "#3c8dbc"
    };
    var line_data2 = {
        data: cos,
        color: "#00c0ef"
    };
    //Initialize tooltip on hover
    $('<div class="tooltip-inner" id="line-chart-tooltip"></div>').css({
        position: "absolute",
        display: "none",
        opacity: 0.8
    }).appendTo("body");
    $("#line-chart").bind("plothover", function (event, pos, item) {

        if (item) {
            var x = item.datapoint[ 0 ].toFixed(2),
                y = item.datapoint[ 1 ].toFixed(2);

            $("#line-chart-tooltip").html(item.series.label + " of " + x + " = " + y)
                .css({top: item.pageY + 5, left: item.pageX + 5})
                .fadeIn(200);
        } else {
            $("#line-chart-tooltip").hide();
        }

    });
    /* END LINE CHART */

    /*
     * FULL WIDTH STATIC AREA CHART
     * -----------------
     */
    var areaData = [ [ 2, 88.0 ], [ 3, 93.3 ], [ 4, 102.0 ], [ 5, 108.5 ], [ 6, 115.7 ], [ 7, 115.6 ],
        [ 8, 124.6 ], [ 9, 130.3 ], [ 10, 134.3 ], [ 11, 141.4 ], [ 12, 146.5 ], [ 13, 151.7 ], [ 14, 159.9 ],
        [ 15, 165.4 ], [ 16, 167.8 ], [ 17, 168.7 ], [ 18, 169.5 ], [ 19, 168.0 ] ];
    $.plot("#area-chart", [ areaData ], {
        grid: {
            borderWidth: 0
        },
        series: {
            shadowSize: 0, // Drawing is faster without shadows
            color: "#00c0ef"
        },
        lines: {
            fill: true //Converts the line chart to area chart
        },
        yaxis: {
            show: false
        },
        xaxis: {
            show: false
        }
    });

    /* END AREA CHART */


});

/*
 * Custom Label formatter
 * ----------------------
 */
function labelFormatter(label, series) {
    return '<div style="font-size:13px; text-align:center; padding:2px; color: #fff; font-weight: 600;">'
        + label
        + "<br>"
        + Math.round(series.percent) + "%</div>";
}


$('#world-map-markers').vectorMap({
    map: 'world_mill_en',
    normalizeFunction: 'polynomial',
    hoverOpacity: 0.7,
    hoverColor: false,
    backgroundColor: 'transparent',
    regionStyle: {
        initial: {
            fill: 'rgba(210, 214, 222, 1)',
            "fill-opacity": 1,
            stroke: 'none',
            "stroke-width": 0,
            "stroke-opacity": 1
        },
        hover: {
            "fill-opacity": 0.7,
            cursor: 'pointer'
        },
        selected: {
            fill: 'yellow'
        },
        selectedHover: {}
    },
    markerStyle: {
        initial: {
            fill: '#00a65a',
            stroke: '#111'
        }
    },
    markers: [
        {latLng: [ 41.90, 12.45 ], name: 'Vatican City'},
        {latLng: [ 43.73, 7.41 ], name: 'Monaco'},
        {latLng: [ -0.52, 166.93 ], name: 'Nauru'},
        {latLng: [ -8.51, 179.21 ], name: 'Tuvalu'},
        {latLng: [ 43.93, 12.46 ], name: 'San Marino'},
        {latLng: [ 47.14, 9.52 ], name: 'Liechtenstein'},
        {latLng: [ 7.11, 171.06 ], name: 'Marshall Islands'},
        {latLng: [ 17.3, -62.73 ], name: 'Saint Kitts and Nevis'},
        {latLng: [ 3.2, 73.22 ], name: 'Maldives'},
        {latLng: [ 35.88, 14.5 ], name: 'Malta'},
        {latLng: [ 12.05, -61.75 ], name: 'Grenada'},
        {latLng: [ 13.16, -61.23 ], name: 'Saint Vincent and the Grenadines'},
        {latLng: [ 13.16, -59.55 ], name: 'Barbados'},
        {latLng: [ 17.11, -61.85 ], name: 'Antigua and Barbuda'},
        {latLng: [ -4.61, 55.45 ], name: 'Seychelles'},
        {latLng: [ 7.35, 134.46 ], name: 'Palau'},
        {latLng: [ 42.5, 1.51 ], name: 'Andorra'},
        {latLng: [ 14.01, -60.98 ], name: 'Saint Lucia'},
        {latLng: [ 6.91, 158.18 ], name: 'Federated States of Micronesia'},
        {latLng: [ 1.3, 103.8 ], name: 'Singapore'},
        {latLng: [ 1.46, 173.03 ], name: 'Kiribati'},
        {latLng: [ -21.13, -175.2 ], name: 'Tonga'},
        {latLng: [ 15.3, -61.38 ], name: 'Dominica'},
        {latLng: [ -20.2, 57.5 ], name: 'Mauritius'},
        {latLng: [ 26.02, 50.55 ], name: 'Bahrain'},
        {latLng: [ 0.33, 6.73 ], name: 'São Tomé and Príncipe'}
    ]
});