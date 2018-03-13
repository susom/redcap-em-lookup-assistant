var lookupAssistant = lookupAssistant || {};

var langMsg68 = '';

// ADDS A SELECT ELEMENT WITH DATA ATTRIBUTES
lookupAssistant.addFilter = function(setting, i) { //id, target, field, i, level) {

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
            // lookupAssistant.log('Change at ' , this);
            lookupAssistant.updateFilters(this, false);
        });

    return sel;
};

lookupAssistant.filterLevel = function(json, value, aggregation) {
    // lookupAssistant.log('filterLevel: ', value, json, aggregation);

    if(value) {
        if (value in json) {
            lookupAssistant.log ('filterLevel: Returning entries for ' + value, json[value]);
            return json[value];
        } else {
            lookupAssistant.log ('filterLevel: Unable to find ' + value + ' in: ', json);
        }
    }

    if (aggregation) {
        // lookupAssistant.log('filterLevel: aggregating values', json);
        var data = {};
        for (var key in json) {
            // lookupAssistant.log ("Skipping " + key + " containing values: ", json[key]);
            var level2 = json[key];
            $.extend(true, data, level2);
        }
        // lookupAssistant.log('filterLevel: aggregating values output', data);
        return data;
    }
    return false;
};


// Take an update to any filter and propagate it down the rest
lookupAssistant.updateFilters = function(select, forceUpdate) {

    // Load reference data
    var field = $(select).data('field');
    var setting = lookupAssistant.settings[field];
    var level_changed = $(select).data('level');
    var level_max = setting.levels.length - 1;
    var updateTarget = $(select).data('updateTarget');
    //var editTarget = setting.edit_target;

    lookupAssistant.log('66', select, level_changed, updateTarget, forceUpdate);

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
            lookupAssistant.log ("updateFilters2: Updating options: changed level " + level_changed + " looping " + j + " of " + level_max + " with forcedUpdate: ", forceUpdate);

            // Build Options with an empty row to start
            var option_data = [ { "id": "", "text": "" }];
            for (var key in data) {
                option_data.push({ "id": key, "text": key });
            }
            lookupAssistant.log("updateFilters2: Options: ", option_data);

            var cache_val = sel.val() || "";
            sel.html('');
            sel.select2({
                theme: 'bootstrap',
                allowClear: true,
                placeholder: setting.levels[j].placeholder,
                width: '90%',
                data: option_data
            }).on('select2:unselecting', function() {
                $(this).data('unselecting', true);
            }).on('select2:opening', function(e) {
                if ($(this).data('unselecting')) {
                    $(this).removeData('unselecting');
                    e.preventDefault();
                }
            });

            // Try to reset it to its current value if still valid
            // if (sel.val() !== cache_val) {
            //     lookupAssistant.log('Select has changed at level ' + j + '- triggering update');
            //     lookupAssistant.log ("Sel val", sel.val());
            //     lookupAssistant.log ("Cache val", cache_val);
            //     //sel.val(cache_val).trigger('change');
            // }
        } else {
            // Skip updating when we are refreshing the data from previous nodes that didn't change
            lookupAssistant.log ("updateFilters2: skipping level on change at " + level_changed + " looping " + j + " of " + level_max);
        }

        // Skip updating the data if it is moot
        if (!empty_remainder && (j < level_max)) {    // maybe subtract 1 from level count???
            data = lookupAssistant.filterLevel(data, filterValue, aggregateOnEmpty);
            if (data === false) empty_remainder = true;
        } else {
            data = false;
        }

        // If it is the last level, then check to update the target
        lookupAssistant.log('Level changed was ' + level_changed + ' and updateTarget is ' , updateTarget);
        if (j === level_changed && updateTarget) {
            setting.target
                .val(sel.val())
                .trigger('blur');
        }


    }

    // Get next level select
    if (level_changed < level_max && !forceUpdate && $(select).val() != '') {
        // lookupAssistant.log("NEXT", level_changed, level_max);
        var next = setting.levels[level_changed + 1].sel;
        // lookupAssistant.log(next);
        next.select2('open');
    }
};

lookupAssistant.init = function() {

    $.each(lookupAssistant.settings, function (i, setting) {
        var field = setting.field;
        lookupAssistant.log("Setting up " + field);

        // Make a pointer to the setting from the field
        lookupAssistant.settings[field] = setting;

        // Make a pointer to the input name
        setting.target = $('input[name="' + field + '"]');

        // Make target read-only
        if (setting.edit_target === false) {
            setting.target.attr('disabled','disabled');
        }

        // Go through each level and create a new select element
        $.each(setting.levels, function(i, level) {
            lookupAssistant.log("Setting up level " + i, level);
            level.level = i;
            level.id = 'select-' + field + '-' + i;
            level.sel = lookupAssistant.addFilter(setting, i);
        });

        $('<hr/>').css({ 'margin':'3px 3px'}).insertBefore(setting.target);

        // Initialize the initial filter
        lookupAssistant.log("About to update initial filters for: ", setting);
        lookupAssistant.updateFilters(setting.levels[0].sel[0], true);
    });

    // Convert select2 inputs of type search to text so that the backspace key works
    $('body').on('focus', ".select2-search__field", function() {
        // lookupAssistant.log(this);
        if ( $(this).attr('type') === 'search') $(this).attr('type','text');
    });
};

lookupAssistant.log = function() {
    // console.log.apply(null, arguments);
};


$(document).ready(function(){
    lookupAssistant.init();
});
