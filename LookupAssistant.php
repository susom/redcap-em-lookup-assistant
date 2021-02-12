<?php

namespace Stanford\LookupAssistant;

use \REDCap as REDCap;
// use \Plugin as Plugin;

require_once("emLoggerTrait.php");

class LookupAssistant extends \ExternalModules\AbstractExternalModule
{
    use emLoggerTrait;

    public $errors = array();
    public $settings = array();

    private function validateJson($contents) {
        // // Verify file exists
        // if (file_exists($path)) {
        //     $contents = file_get_contents($path);

        // Verify contents are json
        $obj = json_decode($contents);

        if (json_last_error() == JSON_ERROR_NONE) {
            // All good
            return $contents;
        } else {
            return false;
            // $this->errors[] = "Error decoding path $path: " . json_last_error_msg();
        }

        // } else {
        //     $this->errors[] = "Unable to locate file $path";
        // }
        // return false;
    }


    // Take the project settings and convert them into a more friendly settings object to pass to javascript
    public function loadSettings($instrument) {

	    // FILTER OUT SETTINGS NOT ON CURRENT INSTRUMENT
	    $instrument_fields = REDCap::getFieldNames($instrument);

	    $instances = $this->getSubSettings('instances');
        $this->settings = [];
	    foreach ($instances as $i => $instance) {
		    // Skip if field isn't present on instrument
		    if (! in_array($instance['field'], $instrument_fields)) {
			    $this->emDebug("Filtering out " . $instance['field'] . " - not on current page $instrument");
		    } else {

		        // Load the json
                switch($instance['json-source']) {
                    case "json-data-file":
	                    // Load the file
	                    $edoc_id = $instance['json-data-file'];
	                    if (is_numeric($edoc_id)) {
		                    $path = \Files::copyEdocToTemp($edoc_id);
                            $json = file_get_contents($path);
		                    // $instance['json-data'] = $this->loadJsonFile($path);
	                    }
                        break;
                    case "json-data":
                        $json = $instance['json-data'];
                        break;
                    case "json-url":
	                    $jsonUrl = filter_var($instance['json-url'],FILTER_SANITIZE_URL);
	                    $json = file_get_contents($jsonUrl);
                }

                // Verify json
                if (empty($json)) {
                    $this->emError("Missing valid json");
                } else if ($this->validateJson($json) === false) {
                    $this->emError("JSON is not valid");
                } else {
                    $instance['json-data'] = $json;
                }


                // if ($instance['json-source'] == "json-data-file") {
                //     // Load the file
	            //     $edoc_id = $instance['json-data-file'];
	            //     if (is_numeric($edoc_id)) {
	            //         $path = \Files::copyEdocToTemp($edoc_id);
	            //         $instance['json-data'] = $this->loadJsonFile($path);
	            //     }
                // } elseif ($instance['json-source'] == "json-data") {
                //     // Use the textarea -- already set
                //
                // } elseif ($instance['json-source'] == "json-url") {
                //     $jsonUrl = filter_var($instance['json-url'],FILTER_SANITIZE_URL);
                //     $json = file_get_contents($jsonUrl);
                //     $instance['json-data'] = $json;
                // }


		        $this->settings[] = $instance;
            }
	    }


	    // $settings = array();
        //
        // $instances = $this->getSubSettings('field-settings');
        // $this->emdebug($instances);
        // // return false;
        //
        // // $edit_targets = $this->getProjectSetting('edit-target');
        // // $json_data_path = $this->getProjectSetting('json-data-path');
        //
        // foreach ($instances as $i => $instance) {
        //     $setting = array(
        //         'field' => $instance['field'],
        //         'edit_target' => $instance['edit-target'],
        //         'json' => $instance['json-data']
        //     );
        //
        //
        //     // Get JSON - determine if we are loading from path or file
        //     // $path = false;
        //     // if (!empty($json_data_path[$i])) {
        //     //     $path = $json_data_path[$i];
        //     // } else {
        //     //     // Get edoc
        //     //     $key = 'json-data-file____' . $i;
        //     //     $edoc_id = $this->getProjectSetting($key);
        //     //     if (is_numeric($edoc_id)) {
        //     //         $path = \Files::copyEdocToTemp($edoc_id);
        //     //     } else {
        //     //         $this->errors[] = "Unable to find a valid json source file for $field in $key";
        //     //     }
        //     // // }
        //     //
        //     // // if ($path) {
        //     //     $setting['json'] = $this->loadJsonFile($path);
        //     //     // $setting['json'] = substr($this->loadJsonFile($path), 0, 50);
        //     // // }
        //
        //     // Get hierarchy for instance
        //
        //
        //     // $placeholders = $this->getProjectSetting("placeholder");
        //     // $aggregate_on_empty = $this->getProjectSetting("aggregate-on-empty");
        //     // $update_target = $this->getProjectSetting("update-target");
        //     // Plugin::log($levels, "levels");
        //     // Plugin::log($placeholders, "placeholder");
        //     // Plugin::log($aggregate_on_empty, "aggregate-on-empty");
        //     // Plugin::log($update_target, "update-target");
        //
        //     $setting['levels'] = array();
        //     foreach ($instance['hierarchy'] as $j => $h) {
        //         $setting['levels'][$j] = array(
        //             "placeholder" => $h['placeholder'],
        //             "aggregateOnEmpty" => $h['aggregate-on-empty'],
        //             "updateTarget" => $h['update-target']
        //         );
        //     }
        //
        //     // $this->emDebug($setting);
        //     $settings[] = $setting;
        // }
        //
        // // $raw = $this->getProjectSettings();
        // // $this->settings = $settings;
	    // $this->settings = $instances;
        //
        //
	    // $this->emDebug($this->settings);
        // return $settings;
    }


    function redcap_data_entry_form_top($project_id, $record, $instrument, $event_id, $group_id)
    {

        $this->loadSettings($instrument);
        if (!empty($this->errors)) {
            $this->emDebug($this->errors);
            return false;
        }

        // Skip out if there is nothing to do
        if (empty($this->settings)) return false;


        // // FILTER OUT SETTINGS NOT ON CURRENT INSTRUMENT
        // $instrument_fields = REDCap::getFieldNames($instrument);
        // foreach ($this->settings as $i => $setting) {
        //     // Skip if field isn't present on instrument
        //     if (! in_array($setting['field'], $instrument_fields)) {
	    //         $this->emDebug("Filtering out " . $setting['field'] . " - not on current page $instrument");
	    //         unset($this->settings[$i]);
        //     }
        // }


        // DUMP CONTENTS TO JAVASCRIPT
        // Append the select2 controls
        $this->insertSelect2();

        echo "<style type='text/css'>" . $this->dumpResource("css/lookup-assistant.css") . "</style>";

        // // Insert our custom JS
        echo "<script type='text/javascript'>" . $this->dumpResource("js/lookupAssistant.js") . "</script>";

        // Insert our custom JS
        echo "<script type='text/javascript'>lookupAssistant.settings = " . json_encode($this->settings) . "</script>";
	    echo "<script type='text/javascript'>lookupAssistant.jsDebug = " . json_encode($this->getProjectSetting('enable-js-debug')) . "</script>";
        ?>
            <style>
                .lookupIcon {
                    position: absolute;
                }
                .lookupIcon > span {
                    position: relative;
                    left: -20px;
                    cursor: pointer;
                }
            </style>
        <?php

    }


    function redcap_survey_page_top($project_id, $record, $instrument, $event_id, $group_id) {
	    $this->loadSettings($instrument);
	    if (!empty($this->errors)) {
		    $this->emDebug($this->errors);
		    return false;
	    }

	    // Skip out if there is nothing to do
	    if (empty($this->settings)) return false;


	    // // FILTER OUT SETTINGS NOT ON CURRENT INSTRUMENT
	    // $instrument_fields = REDCap::getFieldNames($instrument);
	    // foreach ($this->settings as $i => $setting) {
	    //     // Skip if field isn't present on instrument
	    //     if (! in_array($setting['field'], $instrument_fields)) {
	    //         $this->emDebug("Filtering out " . $setting['field'] . " - not on current page $instrument");
	    //         unset($this->settings[$i]);
	    //     }
	    // }


	    // DUMP CONTENTS TO JAVASCRIPT
	    // Append the select2 controls
	    $this->insertSelect2();

	    echo "<style type='text/css'>" . $this->dumpResource("css/lookup-assistant.css") . "</style>";

	    // // Insert our custom JS
	    echo "<script type='text/javascript'>" . $this->dumpResource("js/lookupAssistant.js") . "</script>";

	    // Insert our custom JS
	    echo "<script type='text/javascript'>lookupAssistant.settings = " . json_encode($this->settings) . "</script>";
	    echo "<script type='text/javascript'>lookupAssistant.jsDebug = " . json_encode($this->getProjectSetting('enable-js-debug')) . "</script>";
	    ?>
        <style>
            .lookupIcon {
                position: absolute;
            }
            .lookupIcon > span {
                position: relative;
                left: -20px;
                cursor: pointer;
            }
        </style>
	    <?php
    }


    public function insertSelect2()
    {
        ?>
        <script type="text/javascript"><?php echo $this->dumpResource('js/select2.full.min.js'); ?></script>
        <style><?php echo $this->dumpResource('css/select2.min.css'); ?></style>
        <style><?php echo $this->dumpResource('css/select2-bootstrap.min.css'); ?></style>
        <?php
    }


    public function dumpResource($name)
    {
        $file = $this->getModulePath() . $name;
        if (file_exists($file)) {
            $contents = file_get_contents($file);
            return $contents;
        } else {
            $this->emError("Unable to find $file");
        }
    }


}