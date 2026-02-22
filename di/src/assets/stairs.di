{
  "version": "7",
  "scene": {
    "smart_objects": [
      {
        "id": "dicb460b903642b9",
        "name": "stairs",
        "x": {
          "attributes": {
            "origin": 0,
            "extent": 914.4,
            "length": 914.4,
            "angle": 0.8961
          },
          "invariant": 1
        },
        "y": {
          "attributes": {
            "origin": 0,
            "extent": 3903.32,
            "length": 3903.32,
            "angle": 0
          },
          "invariant": 1
        },
        "z": {
          "attributes": {
            "origin": 0,
            "extent": 38.1,
            "length": 38.1,
            "angle": 0
          },
          "invariant": 1
        },
        "rotation_lock": 0,
        "visible": false,
        "repeater": {
          "gap_min": 152.4,
          "gap_max": 228.6,
          "repeat_axis": 1
        }
      },
      {
        "id": "didc4adea3af42b3",
        "name": "tread",
        "x": {
          "attributes": {
            "origin": 0,
            "extent": 0,
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
            "extent": -3700.12,
            "length": {
              "formula": "tread_d"
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
              "formula": "tread_th"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "rotation_lock": 0,
        "is_template": true,
        "parent_id": "dicb460b903642b9"
      }
    ],
    "constants": [
      {
        "name": "tread_d",
        "value_mm": 203.2
      },
      {
        "name": "tread_th",
        "value_mm": 38.1
      }
    ],
    "camera": {
      "eye": [0, 0, 2750],
      "center": [0, 0, 0],
      "up": [0, 1, 0]
    },
    "root_id": "dicb460b903642b9",
    "selected_id": "dicb460b903642b9",
    "selected_face": 3
  }
}
