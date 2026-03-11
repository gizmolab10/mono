{
  "version": "8",
  "scene": {
    "smart_objects": [
      {
        "id": "didc4131a9e6d366",
        "name": "basement",
        "x": {
          "attributes": {
            "origin": 0,
            "extent": 5439.631494140625,
            "length": 5439.631494140625,
            "angle": 0
          },
          "invariant": 1
        },
        "y": {
          "attributes": {
            "origin": 0,
            "extent": 8839.2,
            "length": 8839.2,
            "angle": 0
          },
          "invariant": 1
        },
        "z": {
          "attributes": {
            "origin": 0,
            "extent": 3187.7,
            "length": 3187.7,
            "angle": 0
          },
          "invariant": 1
        },
        "visible": false
      },
      {
        "id": "dic446a6ac236257",
        "name": "interior wall",
        "x": {
          "attributes": {
            "origin": 5350.731494140626,
            "extent": 0,
            "length": {
              "formula": "stud_w"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "y": {
          "attributes": {
            "origin": 4267.2,
            "extent": 0,
            "length": 4572.000000000001,
            "angle": 0
          },
          "invariant": 1
        },
        "z": {
          "attributes": {
            "origin": {
              "formula": ".s"
            },
            "extent": 0,
            "length": {
              "formula": ".l"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "visible": false,
        "repeater": {
          "spacing": 406.4,
          "firewall": true,
          "is_repeating": true,
          "run_axis": 1,
          "is_diagonal": false,
          "gap_min": 228.6
        },
        "parent_id": "didc4131a9e6d366"
      },
      {
        "id": "dic84259b9649359",
        "name": "stud",
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
            "extent": -4533.900000000001,
            "length": {
              "formula": "template_w"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "z": {
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
        "visible": true,
        "parent_id": "dic446a6ac236257"
      },
      {
        "id": "di184d6393a54051",
        "name": "stairs",
        "x": {
          "attributes": {
            "origin": 3048,
            "extent": -1477.2314941406253,
            "length": 914.4000000000001,
            "angle": 0
          },
          "invariant": 1
        },
        "y": {
          "attributes": {
            "origin": 1219.2,
            "extent": -4572.000000000001,
            "length": 3048,
            "angle": 0
          },
          "invariant": 1
        },
        "z": {
          "attributes": {
            "origin": {
              "formula": ".s"
            },
            "extent": 0,
            "length": {
              "formula": ".l"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "visible": false,
        "repeater": {
          "gap_min": 177.79999999999998,
          "gap_max": 254,
          "is_repeating": true,
          "run_axis": 1,
          "rise_axis": 2,
          "is_diagonal": true,
          "_orig_run_length": 203.2
        },
        "parent_id": "didc4131a9e6d366"
      },
      {
        "id": "did246599f0333ec",
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
            "extent": -2780.6315789473683,
            "length": {
              "formula": "tread_d"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "z": {
          "attributes": {
            "origin": 209.97333333333333,
            "extent": -2939.6266666666666,
            "length": {
              "formula": "tread_th"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "visible": true,
        "parent_id": "di184d6393a54051"
      },
      {
        "id": "di0447e5812b5d13",
        "name": "front wall",
        "x": {
          "attributes": {
            "origin": {
              "formula": ".s"
            },
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
            "extent": -8750.300000000001,
            "length": 88.89999999999964,
            "angle": 0
          },
          "invariant": 0
        },
        "z": {
          "attributes": {
            "origin": {
              "formula": ".s"
            },
            "extent": 0,
            "length": {
              "formula": ".l"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "visible": false,
        "repeater": {
          "spacing": 406.4,
          "firewall": true,
          "is_repeating": true,
          "run_axis": 0,
          "is_diagonal": false
        },
        "parent_id": "didc4131a9e6d366"
      },
      {
        "id": "di4a4e0baeeae628",
        "name": "template",
        "x": {
          "attributes": {
            "origin": 0,
            "extent": -5401.531494140625,
            "length": {
              "formula": "template_th"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "y": {
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
        "z": {
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
        "visible": true,
        "parent_id": "di0447e5812b5d13"
      }
    ],
    "constants": [
      {
        "name": "template_w",
        "value_mm": 38.1
      },
      {
        "name": "tread_d",
        "value_mm": 203.2
      },
      {
        "name": "tread_th",
        "value_mm": 38.099999999999994
      },
      {
        "name": "inset",
        "value_mm": 6.35
      },
      {
        "name": "dado",
        "value_mm": 6.35
      },
      {
        "name": "top_h",
        "value_mm": 101.6
      },
      {
        "name": "middle_h",
        "value_mm": 152.39999999999998
      },
      {
        "name": "bottom_h",
        "value_mm": 215.89999999999998
      },
      {
        "name": "bottom_Inset",
        "value_mm": 19.049999999999997
      },
      {
        "name": "side_th",
        "value_mm": 12.7
      },
      {
        "name": "front_th",
        "value_mm": 19.049999999999997
      },
      {
        "name": "back_th",
        "value_mm": 12.7
      },
      {
        "name": "bottom_th",
        "value_mm": 6.35
      },
      {
        "name": "stud_w",
        "value_mm": 88.89999999999999
      },
      {
        "name": "template_th",
        "value_mm": 38.1
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
    "root_id": "didc4131a9e6d366",
    "selected_id": "di0447e5812b5d13",
    "selected_face": 1
  }
}