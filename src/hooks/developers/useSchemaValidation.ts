"use client";

import { useMemo, useState, useCallback } from "react";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import type { SchemaObject } from "@/types/openapi";

/** Converts an Ajv instancePath (e.g. "/payload/function") to a dot-path (e.g. "payload.function") */
function instancePathToField(path: string): string {
  return path.replace(/^\//, "").replace(/\//g, ".");
}

/** Convert OpenAPI SchemaObject to a JSON Schema draft-07 compatible object */
function toJsonSchema(schema: SchemaObject): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  if (schema.type) result.type = schema.type;
  if (schema.format) result.format = schema.format;
  if (schema.enum) result.enum = schema.enum;
  if (schema.required) result.required = schema.required;
  if (schema.items) result.items = toJsonSchema(schema.items);
  if (schema.properties) {
    result.properties = Object.fromEntries(
      Object.entries(schema.properties).map(([k, v]) => [k, toJsonSchema(v)])
    );
  }
  if (schema.oneOf) {
    result.oneOf = schema.oneOf.map(toJsonSchema);
    if (schema.discriminator) {
      result.discriminator = { propertyName: schema.discriminator.propertyName };
    }
  }
  return result;
}

export interface ValidationErrors {
  /** Map from field path (e.g. "sender", "payload.function") to error message */
  fieldErrors: Map<string, string>;
  /** Whether there are any errors */
  hasErrors: boolean;
}

const EMPTY: ValidationErrors = { fieldErrors: new Map(), hasErrors: false };

export function useSchemaValidation(schema: SchemaObject | undefined) {
  const [errors, setErrors] = useState<ValidationErrors>(EMPTY);

  const ajv = useMemo(() => {
    const instance = new Ajv({ allErrors: true, strict: false });
    addFormats(instance);
    return instance;
  }, []);

  const validateFn = useMemo(() => {
    if (!schema) return null;
    try {
      return ajv.compile(toJsonSchema(schema));
    } catch {
      // If schema compilation fails (e.g., unsupported keywords), skip validation
      return null;
    }
  }, [ajv, schema]);

  const validate = useCallback(
    (data: unknown): boolean => {
      if (!validateFn) {
        setErrors(EMPTY);
        return true;
      }

      const valid = validateFn(data);
      if (valid) {
        setErrors(EMPTY);
        return true;
      }

      const fieldErrors = new Map<string, string>();
      for (const err of validateFn.errors ?? []) {
        const field = err.instancePath
          ? instancePathToField(err.instancePath)
          : err.params?.missingProperty ?? "";
        if (field) {
          fieldErrors.set(field, err.message ?? "Invalid value");
        }
      }
      setErrors({ fieldErrors, hasErrors: true });
      return false;
    },
    [validateFn],
  );

  const clearErrors = useCallback(() => setErrors(EMPTY), []);

  return { validate, errors, clearErrors };
}
