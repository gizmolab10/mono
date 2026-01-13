import { describe, it, expect } from "vitest";
import { serializeObject } from "../../../../notes/experiments/app/serializers";

describe("serializeObject", () => {
  it("handles empty object", async () => {
    const fakeObject = {
      listProperties: async () => [],
      get: async (key) => key + "_value"
    };
    const result = await serializeObject(fakeObject);
    expect(result).toEqual({});
  });
});