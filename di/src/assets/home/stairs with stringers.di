{
  "version": "9",
  "scene": {
    "smart_objects": [
      {
        "id": "die2463eb347311e",
        "name": "stairs with stringers",
        "x": {
          "attributes": {
            "origin": 0,
            "extent": 981.8692403793335,
            "length": 981.8692403793335,
            "angle": 0
          },
          "invariant": 1
        },
        "y": {
          "attributes": {
            "origin": 0,
            "extent": 2320.135397338867,
            "length": 2320.135397338867,
            "angle": 0
          },
          "invariant": 1
        },
        "z": {
          "attributes": {
            "origin": 0,
            "extent": 4010.427941894531,
            "length": 4010.427941894531,
            "angle": 0
          },
          "invariant": 1
        },
        "visible": false,
        "hide_children": false
      },
      {
        "id": "di60437b8975b71b",
        "name": "stairs",
        "x": {
          "attributes": {
            "origin": 34.57744426727294,
            "extent": -32.89179611206043,
            "length": 914.4000000000001,
            "angle": 0
          },
          "invariant": 1
        },
        "y": {
          "attributes": {
            "origin": 0,
            "extent": 118.26460266113281,
            "length": 2438.3999999999996,
            "angle": 0
          },
          "invariant": 1
        },
        "z": {
          "attributes": {
            "origin": 529.840690612793,
            "extent": -432.5872512817382,
            "length": 3048,
            "angle": 0
          },
          "invariant": 1
        },
        "visible": false,
        "hide_children": false,
        "repeater": {
          "gap_min": 152.39999999999998,
          "gap_max": 228.6,
          "is_repeating": true,
          "run_axis": 1,
          "rise_axis": 2,
          "is_diagonal": true,
          "_orig_run_length": 203.19999999999982
        },
        "parent_id": "die2463eb347311e"
      },
      {
        "id": "di1748aab030a1ba",
        "name": "tread",
        "x": {
          "attributes": {
            "origin": 0,
            "extent": 0,
            "length": {
              "formula": ".l"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "y": {
          "attributes": {
            "origin": 0,
            "extent": -2238.5311475409835,
            "length": 199.86885245901635,
            "angle": 0
          },
          "invariant": 1
        },
        "z": {
          "attributes": {
            "origin": 188.11875,
            "extent": -2821.78125,
            "length": {
              "formula": "tread thickness"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "visible": true,
        "hide_children": false,
        "parent_id": "di60437b8975b71b"
      },
      {
        "id": "di2343faabad971e",
        "name": "left stringer",
        "x": {
          "attributes": {
            "origin": -3.5225557327270565,
            "extent": {
              "formula": "stairs.s"
            },
            "length": {
              "formula": "tread thickness"
            },
            "angle": -0.7068583470577035
          },
          "invariant": 0
        },
        "y": {
          "attributes": {
            "origin": 1173.4063572883606,
            "extent": -860.9790400505062,
            "length": {
              "formula": "stringer width"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "z": {
          "attributes": {
            "origin": 5.457133483886707,
            "extent": 0,
            "length": 4004.9708084106446,
            "angle": 0
          },
          "invariant": 1
        },
        "visible": true,
        "hide_children": false,
        "parent_id": "die2463eb347311e"
      },
      {
        "id": "di2142dda47b00ed",
        "name": "right stringer",
        "x": {
          "attributes": {
            "origin": {
              "formula": "stairs.e"
            },
            "extent": 5.2082038879395895,
            "length": {
              "formula": "tread thickness"
            },
            "angle": -0.7068583470577035
          },
          "invariant": 1
        },
        "y": {
          "attributes": {
            "origin": 1164.5349502563477,
            "extent": -869.8504470825192,
            "length": {
              "formula": "stringer width"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "z": {
          "attributes": {
            "origin": 0,
            "extent": -5.732968139648619,
            "length": 4004.6949737548825,
            "angle": 0
          },
          "invariant": 1
        },
        "visible": true,
        "hide_children": false,
        "parent_id": "die2463eb347311e"
      }
    ],
    "givens": [
      {
        "name": "stringer width",
        "value_mm": 285.75,
        "locked": true
      },
      {
        "name": "tread thickness",
        "value_mm": 38.099999999999994,
        "locked": true
      }
    ],
    "camera": {
      "eye": [
        0,
        0,
        2750
      ],
      "center": [
        0,
        0,
        0
      ],
      "up": [
        0,
        1,
        0
      ]
    },
    "root_id": "die2463eb347311e",
    "selected_id": "di2142dda47b00ed",
    "selected_face": 5
  }
}