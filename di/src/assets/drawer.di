{
  "version": "5",
  "scene": {
    "smart_objects": [
      {
        "id": "dicb460b903642b9",
        "name": "drawer",
        "x": {
          "attributes": {
            "origin": 0,
            "extent": 609.6,
            "length": 609.6,
            "angle": 0
          },
          "invariant": 1
        },
        "y": {
          "attributes": {
            "origin": 0,
            "extent": 609.6,
            "length": 609.6,
            "angle": 0
          },
          "invariant": 1
        },
        "z": {
          "attributes": {
            "origin": 0,
            "extent": 152.39999999999998,
            "length": 152.39999999999998,
            "angle": 0
          },
          "invariant": 1
        },
        "rotation_lock": 0,
        "visible": false
      },
      {
        "id": "di4b4804a2257d24",
        "name": "left",
        "x": {
          "attributes": {
            "origin": {
              "formula": "side_th"
            },
            "extent": -1193.8000000000002,
            "length": {
              "formula": "side_th"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "y": {
          "attributes": {
            "origin": {
              "formula": "front_th-dado"
            },
            "extent": -609.5999999999999,
            "length": {
              "formula": ".d-front_th+dado"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "z": {
          "attributes": {
            "origin": {
              "formula": "inset"
            },
            "extent": -158.74999999999997,
            "length": {
              "formula": ".h-inset*2"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "rotation_lock": 1,
        "parent_id": "dicb460b903642b9"
      },
      {
        "id": "di13424da785088c",
        "name": "front",
        "x": {
          "attributes": {
            "origin": 0,
            "extent": -609.6,
            "length": {
              "formula": ".w"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "y": {
          "attributes": {
            "origin": 0,
            "extent": -1200.15,
            "length": 19.049999999999955,
            "angle": 0
          },
          "invariant": 1
        },
        "z": {
          "attributes": {
            "origin": 0,
            "extent": -152.39999999999998,
            "length": {
              "formula": ".h"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "rotation_lock": 2,
        "parent_id": "dicb460b903642b9"
      },
      {
        "id": "di7a4d149e03e80e",
        "name": "right",
        "x": {
          "attributes": {
            "origin": 584.1999999999999,
            "extent": {
              "formula": ".w-inset*2"
            },
            "length": {
              "formula": "side_th"
            },
            "angle": 0
          },
          "invariant": 0
        },
        "y": {
          "attributes": {
            "origin": {
              "formula": "front_th-dado"
            },
            "extent": -609.5999999999999,
            "length": {
              "formula": ".d-front_th+dado"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "z": {
          "attributes": {
            "origin": {
              "formula": "inset"
            },
            "extent": -158.74999999999997,
            "length": {
              "formula": ".h-inset*2"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "rotation_lock": 1,
        "parent_id": "dicb460b903642b9"
      },
      {
        "id": "di7649b89c909dd5",
        "name": "back",
        "x": {
          "attributes": {
            "origin": {
              "formula": "side_th+inset"
            },
            "extent": -628.6500000000001,
            "length": {
              "formula": ".w-(side_th+inset)*2"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "y": {
          "attributes": {
            "origin": 596.9,
            "extent": {
              "formula": ".d"
            },
            "length": {
              "formula": "side_th"
            },
            "angle": 0
          },
          "invariant": 0
        },
        "z": {
          "attributes": {
            "origin": {
              "formula": "inset"
            },
            "extent": -158.74999999999997,
            "length": {
              "formula": ".h-inset*2"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "rotation_lock": 0,
        "parent_id": "dicb460b903642b9"
      },
      {
        "id": "di2c4bcd860b5f48",
        "name": "bottom",
        "x": {
          "attributes": {
            "origin": {
              "formula": "side_th+inset"
            },
            "extent": -628.6500000000001,
            "length": {
              "formula": ".w-(side_th+inset)*2"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "y": {
          "attributes": {
            "origin": {
              "formula": "front_th-dado"
            },
            "extent": -615.9499999999999,
            "length": {
              "formula": ".d-inset*3"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "z": {
          "attributes": {
            "origin": {
              "formula": "inset*2"
            },
            "extent": -285.74999999999994,
            "length": {
              "formula": "bottom_th"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "rotation_lock": 0,
        "parent_id": "dicb460b903642b9"
      }
    ],
    "constants": [
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
    "root_id": "dicb460b903642b9",
    "selected_id": "di2c4bcd860b5f48",
    "selected_face": 3
  }
}