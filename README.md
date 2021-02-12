# Lookup Assistant

This external module provides an easy way to find values from a large list
and add them to a REDCap input field.

It supports a single group of choices or a nested hierarchy, such as the:
Year, Make, Model or see the example with Country, State, City.

The 'hierarchy' file must be in JSON format and looks something like:
```json
{
  "United States": {
    "Minnesota": {
      "Minneapolis": "Minneapolis",
      "St. Paul": "St. Paul",
    },
    "California": {
      "Fresno": "Fresno"
    }
  }
}
```
Note that the last level should just have a value that matches the key.

An example hierarchy can be found in `examples/lookupAssistantCountryStateCity.json`

Only the last level is stored in the input field so it doesn't work backwards and you should probably design your
hierarchy so that it supports unique names for the last level.

It might be useful to use this if you have a very large list of values to choose from.


## Options
When you skip a level in the hierarchy, there are two options.  You can either not permit selection of a 'state' until
a 'country' is selected.  Or, you can have all states merged into a single field when no country is selected.  This
second option can cause delays if the hierarchy is large as the processing is done on the client.

You can choose whether the final text entry field is editable or not.  If it is editable, one can choose a value
that is not part of the lookup.  So, you can try and reduce duplicate entries but still permit the entry of a value
not in your hierarchy.

## Improvements
A ton could be done to make this better..
- Adding the option to store the intermediate hierarchies in different fields
- Ability to control coding vs what's visible in the select2
- server-side lookups for REALLY large hierarchies (similar to the ontologies)

It was made for the purpose of finding hospitals/clinics in India.  There are a LOT in the entire country.  This allowed
for a rapid search and drastically reduced errors when free-text entry was used.

An example is here: https://redcap.stanford.edu/surveys/?s=HR4EWEKKKY