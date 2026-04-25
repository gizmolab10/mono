{
  "version": "9",
  "scene": {
    "smart_objects": [
      {
        "id": "did544449f3d5e57",
        "name": "blocks",
        "x": {
          "attributes": {
            "origin": 0,
            "extent": 609.5999999998845,
            "length": 609.5999999998845,
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
            "extent": 609.6,
            "length": 609.6,
            "angle": 0
          },
          "invariant": 1
        },
        "visible": false,
        "hide_children": false
      },
      {
        "id": "diba47a18c85ba9d",
        "name": "A",
        "x": {
          "attributes": {
            "origin": {
              "formula": ".s"
            },
            "extent": -507.9999999998845,
            "length": {
              "formula": "thick"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "y": {
          "attributes": {
            "origin": {
              "formula": ".s"
            },
            "extent": {
              "formula": ".e"
            },
            "length": 609.6,
            "angle": 0
          },
          "invariant": 2
        },
        "z": {
          "attributes": {
            "origin": {
              "formula": ".s"
            },
            "extent": {
              "formula": ".e"
            },
            "length": 609.6,
            "angle": 0
          },
          "invariant": 2
        },
        "visible": true,
        "hide_children": false,
        "parent_id": "did544449f3d5e57"
      },
      {
        "id": "dib543189150f4d8",
        "name": "B",
        "x": {
          "attributes": {
            "origin": {
              "formula": "A.e"
            },
            "extent": {
              "formula": ".e"
            },
            "length": 507.9999999998845,
            "angle": 0
          },
          "invariant": 2
        },
        "y": {
          "attributes": {
            "origin": {
              "formula": ".s"
            },
            "extent": -508,
            "length": {
              "formula": "thick"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "z": {
          "attributes": {
            "origin": {
              "formula": ".s"
            },
            "extent": {
              "formula": ".e"
            },
            "length": 609.6,
            "angle": 0
          },
          "invariant": 2
        },
        "visible": true,
        "hide_children": false,
        "parent_id": "did544449f3d5e57"
      }
    ],
    "givens": [
      {
        "name": "thick",
        "value_mm": 101.6,
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
    "root_id": "did544449f3d5e57",
    "selected_id": "dib543189150f4d8",
    "selected_face": 1
  }
}