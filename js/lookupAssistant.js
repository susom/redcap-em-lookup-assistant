var fhl = fhl || {};

var langMsg68 = '';

// ADDS A SELECT ELEMENT WITH DATA ATTRIBUTES
fhl.addFilter = function(setting, i) { //id, target, field, i, level) {

    var level = setting.levels[i];

    // Bind to state selection
    var sel = $('<select/>')
        .attr('id', level.id)
        .data('level', i)
        .data('field', setting.field)
        .data('placeholder', level.placeholder)
        .data('aggregateOnEmpty', level.aggregateOnEmpty)
        .data('updateTarget', level.updateTarget)
        .insertBefore(setting.target)
        .wrapAll('<div/>')
        .on('change', function() {
            // console.log('Change at ' , this);
            fhl.updateFilters(this, false);
        });

    return sel;
};

fhl.filterLevel = function(json, value, aggregation) {
    // console.log('filterLevel: ', value, json, aggregation);

    if(value) {
        if (value in json) {
            console.log ('filterLevel: Returning entries for ' + value, json[value]);
            return json[value];
        } else {
            console.log ('filterLevel: Unable to find ' + value + ' in: ', json);
        }
    }

    if (aggregation) {
        // console.log('filterLevel: aggregating values', json);
        var data = {};
        for (var key in json) {
            // console.log ("Skipping " + key + " containing values: ", json[key]);
            var level2 = json[key];
            $.extend(true, data, level2);
        }
        // console.log('filterLevel: aggregating values output', data);
        return data;
    }
    return false;
};


// Take an update to any filter and propagate it down the rest
fhl.updateFilters = function(select, forceUpdate) {

    // Load reference data
    var field = $(select).data('field');
    var setting = fhl.settings[field];
    var level_changed = $(select).data('level');
    var level_max = setting.levels.length - 1;
    var updateTarget = $(select).data('updateTarget') || false;

    // Filter Data from Level 0 up
    var data = Object.assign({}, setting.json); // This is the running data from the settings
    var empty_remainder = false;                // This is a variable to skip remaining fields
    for (j=0; j<=level_max; j++) {
        var sel              = setting.levels[j].sel;
        var filterValue      = sel.val() || "";
        var aggregateOnEmpty = sel.data('aggregateOnEmpty') || false;

        // Only update the dropdowns for those dependent on previous values
        if (j > level_changed || forceUpdate) {
            // Update this node
            console.log ("updateFilters2: Updating options: changed level " + level_changed + " looping " + j + " of " + level_max);

            // Build Options with an empty row to start
            var option_data = [ { "id": "", "text": "" }];
            for (var key in data) {
                option_data.push({ "id": key, "text": key });
            }
            console.log("updateFilters2: Options: ", option_data);

            cache_val = sel.val();
            sel.html('');
            sel.select2({
                theme: 'bootstrap',
                allowClear: true,
                placeholder: setting.levels[j].placeholder,
                width: '90%',
                data: option_data
            });

            // Try to reset it to its current value if still valid
            if (sel.val() !== cache_val) sel.val(cache_val).trigger('change');
        } else {
            // Skip updating when we are refreshing the data from previous nodes that didn't change
            console.log ("updateFilters2: skipping level on change at " + level_changed + " looping " + j + " of " + level_max);
        }

        // Skip updating the data if it is moot
        if (!empty_remainder && (j < level_max)) {    // maybe subtract 1 from level count???
            data = fhl.filterLevel(data, filterValue, aggregateOnEmpty);
            if (data === false) empty_remainder = true;
        } else {
            data = false;
        }

        // If it is the last level, then check to update the target
        if (j === level_max && updateTarget) {
            setting.target.val(sel.val());
        }
    }
};

fhl.init = function() {

    $.each(fhl.settings, function (i, setting) {
        var field = setting.field;
        console.log("Setting up " + field);

        // Make a pointer to the setting from the field
        fhl.settings[field] = setting;

        // Make a pointer to the input name
        setting.target = $('input[name="' + field + '"]');

        // Go through each level and create a new select element
        $.each(setting.levels, function(i, level) {
            level.level = i;
            level.id = 'select-' + field + '-' + i;
            level.sel = fhl.addFilter(setting, i);
        });

        $('<hr/>').css({ 'margin':'3px 3px'}).insertBefore(setting.target);

        // Initialize the initial filter
        fhl.updateFilters(setting.levels[0].sel[0], true);

    });
};


$(document).ready(function(){
    fhl.init();
});
