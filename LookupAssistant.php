<?php

namespace Stanford\LookupAssistant;

use \REDCap as REDCap;
// use \Plugin as Plugin;

class LookupAssistant extends \ExternalModules\AbstractExternalModule
{
    public $errors = array();
    public $settings = array();

    private function loadJsonFile($path) {
        // Verify file exists
        if (file_exists($path)) {
            $contents = file_get_contents($path);

            // Verify contents are json
            $obj = json_decode($contents);

            if (json_last_error() == JSON_ERROR_NONE) {
                // All good
                return $obj;
            } else {
                $this->errors[] = "Error decoding path $path: " . json_last_error_msg();
            }
        } else {
            $this->errors[] = "Unable to locate file $path";
        }
        return false;
    }


    public function debugSettings($make_shorter = true) {
        $a = $this->settings;

        if ($make_shorter) {
            foreach ($a as $field => &$setting) {
                $setting['json'] = substr($setting['json'],0,50) . "...";
                $setting['json'] = substr($setting['json'],0,50) . "...";
            }
        }

        self::debug($a);
    }

    // Take the project settings and convert them into a more friendly settings object to pass to javascript
    public function loadSettings() {
        $settings = array();

        $fields = $this->getProjectSetting('field');
        $json_data_path = $this->getProjectSetting('json-data-path');

        foreach ($fields as $i => $field) {
            $setting = array('field' => $field);

            // Get JSON - determine if we are loading from path or file
            $path = false;
            if (!empty($json_data_path[$i])) {
                $path = $json_data_path[$i];
            } else {
                // Get edoc
                $key = 'json-data-file____' . $i;
                $edoc_id = $this->getProjectSetting($key);
                if (is_numeric($edoc_id)) {
                    $path = \Files::copyEdocToTemp($edoc_id);
                } else {
                    $this->errors[] = "Unable to find a valid json source file for $field in $key";
                }
            }

            if ($path) {
                $setting['json'] = $this->loadJsonFile($path);
                // $setting['json'] = substr($this->loadJsonFile($path), 0, 50);
            }

            $placeholders = $this->getProjectSetting("placeholder");
            $aggregate_on_empty = $this->getProjectSetting("aggregate-on-empty");
            $update_target = $this->getProjectSetting("update-target");

            // Plugin::log($levels, "levels");
            // Plugin::log($placeholders, "placeholder");
            // Plugin::log($aggregate_on_empty, "aggregate-on-empty");
            // Plugin::log($update_target, "update-target");

            $setting['levels'] = array();
            foreach ($placeholders[$i] as $j => $placeholder) {
                $setting['levels'][$j] = array(
                    "placeholder" => $placeholder,
                    "aggregateOnEmpty" => $aggregate_on_empty[$i][$j],
                    "updateTarget" => $update_target[$i][$j]
                );
            }

            //Plugin::log($setting, "$field Setting");
            $settings[] = $setting;
        }

        // $raw = $this->getProjectSettings();
        $this->settings = $settings;
        return $settings;
    }


    function redcap_data_entry_form_top($project_id, $record, $instrument, $event_id, $group_id)
    {

        $this->loadSettings();
        if (!empty($this->errors)) {
            self::debug($this->errors, "ERROR");
            return false;
        }


        // FILTER OUT SETTINGS NOT ON CURRENT INSTRUMENT
        $instrument_fields = REDCap::getFieldNames($instrument);
        foreach ($this->settings as $i => $setting) {
            // Skip if field isn't present on instrument
            if (! in_array($setting['field'], $instrument_fields)) unset($this->settings[$i]);
        }


        // $this->debugSettings();
        //TEST
        // unset($this->settings['1']);

        // DUMP CONTENTS TO JAVASCRIPT
            // Append the select2 controls
            $this->insertSelect2();

            // // Insert our custom JS
            echo "<script type='text/javascript'>" . $this->dumpResource("js/lookupAssistant.js") . "</script>";

            // Insert our custom JS
            echo "<script type='text/javascript'>fhl.settings = " . json_encode($this->settings) . "</script>";
            // echo "<script type='text/javascript'>fhl.settings = " . file_get_contents("/tmp/hospitals_by_district.json") . "</script>";
    }


    public function insertSelect2()
    {
        ?>
        <script type="text/javascript"><?php echo $this->dumpResource('js/select2.full.min.js'); ?></script>
        <style><?php echo $this->dumpResource('css/select2.min.css'); ?></style>
        <style><?php echo $this->dumpResource('css/select2-bootstrap.min.css'); ?></style>
        <?php
    }

    public static function debug() {
        $args = func_get_args();

        if ( class_exists('\Plugin') ) {
            call_user_func_array('\Plugin', $args);
        } else {
            error_log(json_encode($args));
        }
    }


    public function dumpResource($name)
    {
        $file = $this->getModulePath() . $name;
        if (file_exists($file)) {
            $contents = file_get_contents($file);
            return $contents;
        } else {
            error_log("Unable to find $file");
        }
    }


}