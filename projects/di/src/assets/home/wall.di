{
  "version": "9",
  "scene": {
    "smart_objects": [
      {
        "id": "di8a2f4c6e1b3d5a",
        "name": "wall",
        "x": {
          "attributes": {
            "origin": 0,
            "extent": 2438.4,
            "length": 2438.4,
            "angle": 0
          },
          "invariant": 1
        },
        "y": {
          "attributes": {
            "origin": 0,
            "extent": 88.9,
            "length": 88.9,
            "angle": 0
          },
          "invariant": 1
        },
        "z": {
          "attributes": {
            "origin": 0,
            "extent": 2438.4,
            "length": 2438.4,
            "angle": 0
          },
          "invariant": 1
        },
        "visible": false,
        "hide_children": false,
        "repeater": {
          "spacing": 406.4,
          "firewall": true,
          "is_repeating": true,
          "run_axis": 0,
          "is_diagonal": false
        }
      },
      {
        "id": "di7b3e5d9a2c4f1e",
        "name": "stud",
        "x": {
          "attributes": {
            "origin": 0,
            "extent": -2400.3,
            "length": {
              "formula": "stud thickness"
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
        "hide_children": false,
        "parent_id": "di8a2f4c6e1b3d5a"
      }
    ],
    "givens": [
      {
        "name": "wall thickness",
        "value_mm": 88.9,
        "locked": true
      },
      {
        "name": "stud thickness",
        "value_mm": 38.1,
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
    "root_id": "di8a2f4c6e1b3d5a",
    "selected_id": "di8a2f4c6e1b3d5a",
    "selected_face": 1
  }
}