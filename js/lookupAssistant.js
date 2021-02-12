var lookupAssistant = lookupAssistant || {};
var langMsg68 = '';


lookupAssistant.init = function() {

    lookupAssistant.log("Init Settings:", lookupAssistant.settings);

    $.each(lookupAssistant.settings, function (i, setting) {

        // Get the target field
        let field = setting.field;
        lookupAssistant.log("Setting up " + field);

        lookupAssistant.modal = $('div.lookupAssistantDialog');
        lookupAssistant.modalBody = $('div.lookupAssistantDialog .modal-body');

        // Make a link from field to setting
        lookupAssistant.settings[field] = setting;

        // Make a pointer to the setting from the field
        // lookupAssistant.settings[field] = setting;
        // lookupAssistant.fieldIndex[field] = i;

        // Make a pointer to the input name
        setting.target = $('input[name="' + field + '"]');

        // Add settings index to target for reverse lookup
        setting.target.data("lookupAssistantIndex", i);

        // Create a lookup icon and overlay on input
        var icon = $('<span class="lookupIcon"><span title="Lookup Assistant" class="badge badge-xs p-1 btn-secondary text-light"><i class="fas fa-search-plus"></i></span></span>')
            .on('click', function() {
                // console.log(this, $(this).parentsUntil('tr').find('.lookupAssistant'));
                $(this).parentsUntil('tr').find('.lookupAssistant').toggle();
            })
            .insertAfter(setting.target)
        ;

        // Make target read-only
        if (setting['edit-target'] === false) {
            setting.target.attr('disabled','disabled');
        }

        // Go through each level and create a new select element
        var container = $('<div class="lookupAssistant"></div>')
            .insertBefore(setting.target);

        $.each(setting.hierarchy, function(j, detail) {
            // level comes with placeholder, aggregate-on-empty, and update-target

            lookupAssistant.log("Setting up level " + j, detail);
            detail.level = j;
            detail.sel = $('<select/>')
                .attr('id', 'select-' + field + '-' + j)
                .data('level', j)
                .data('field', field)
                .data('placeholder', detail.placeholder)
                .data('aggregateOnEmpty', detail['aggregate-on-empty'])
                .data('updateTarget', detail['update-target'])
                // .insertBefore(setting.target)
                // .appendTo(lookupAssistant.modalBody)
                .wrapAll('<div/>')
                .on('change', function() {
                    lookupAssistant.updateFilters(this, false);
                })
                .appendTo(container)
            ;
                // lookupAssistant.addFilter(setting, j);
        });

        lookupAssistant.log("Set up done");
        // lookupAssistant.modal.show();

        $('<hr/>').css({ 'margin':'3px 3px'}).appendTo(container);

        // Initialize the initial filter
        // lookupAssistant.log("About to update initial filters for: ", setting);
        lookupAssistant.updateFilters(setting.hierarchy[0].sel[0], true);

        // If
        if (setting.target.val() !== '') {
            container.toggle();
        }

    });

    // Convert select2 inputs of type search to text so that the backspace key works
    $('body').on('focus', ".select2-search__field", function() {
        // lookupAssistant.log(this);
        if ( $(this).attr('type') === 'search') $(this).attr('type','text');
    });
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
    lookupAssistant.log('updateFilters', select, forceUpdate);

    var field = $(select).data('field');
    var setting = lookupAssistant.settings[field];
    var level_changed = $(select).data('level');
    var level_max = setting.hierarchy.length - 1;
    var updateTarget = $(select).data('updateTarget');
    //var editTarget = setting.edit_target;

    lookupAssistant.log('131', select, level_changed, updateTarget, forceUpdate, setting.json);

    // Filter Data from Level 0 up
    var data = Object.assign({}, JSON.parse(setting['json-data'])); // This is the running data from the settings
    var empty_remainder = false;                // This is a variable to skip remaining fields

    for (j=0; j<=level_max; j++) {
        var sel              = setting.hierarchy[j].sel;
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
                placeholder: setting.hierarchy[j].placeholder,
                width: '90%',
                data: option_data
            }).on('select2:unselecting', function() {
                $(this).data('unselecting', true);
            }).on('select2:opening', function(e) {
                if ($(this).data('unselecting')) {
                    $(this).removeData('unselecting');
                    e.preventDefault();
                }
            }).on('select2:selecting', function() {
                console.log('selected!');
            })
            ;

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
        lookupAssistant.log(setting.field + ' Level changed was ' + level_changed + ' and updateTarget is ' , updateTarget);
        if (j === level_changed && updateTarget) {
            if (setting.target.val() == '' && sel.val() == '') {
                // Don't do anything
            } else {
                var t = setting.target
                    .val(sel.val())
                    .trigger('blur')
                ;

                // Hide current lookups
                $(sel).closest('div.lookupAssistant').hide();
                // console.log(sel, c);

                // Goto next input/select
                setTimeout(function() {
                    t.parentsUntil('tr').parent().next().find('input,select').focus();
                }, 100);
            }
        }


    }

    // Get next level select
    if (level_changed < level_max && !forceUpdate && $(select).val() != '') {
        // lookupAssistant.log("NEXT", level_changed, level_max);
        var next = setting.hierarchy[level_changed + 1].sel;
        // lookupAssistant.log(next);
        next.select2('open');
    }
};

lookupAssistant.log = function() {
    if (this.jsDebug) console.log.apply(null, arguments);
};

$(document).ready(function(){
    lookupAssistant.init();
});
