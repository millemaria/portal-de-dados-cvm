/**
 * Databricks SQL Statement Execution API response types
 * @see https://docs.databricks.com/api/workspace/statementexecution
 */

export interface DatabricksStatementRequest {
  /** The SQL statement to execute */
  statement: string;
  /** The warehouse ID to execute against */
  warehouse_id: string;
  /** Optional catalog override */
  catalog?: string;
  /** Optional schema override */
  schema?: string;
  /** Statement parameters for parameterized queries */
  parameters?: DatabricksParameter[];
  /** Wait timeout in seconds */
  wait_timeout?: string;
  /** Result disposition */
  disposition?: "INLINE" | "EXTERNAL_LINKS";
  /** Result format */
  format?: "JSON_ARRAY" | "ARROW_STREAM" | "CSV";
}

export interface DatabricksParameter {
  name: string;
  value: string;
  type?: string;
}

export interface DatabricksStatementResponse {
  statement_id: string;
  status: {
    state: "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED" | "CANCELED" | "CLOSED";
    error?: {
      error_code: string;
      message: string;
    };
  };
  manifest?: {
    format: string;
    schema: {
      column_count: number;
      columns: Array<{
        name: string;
        type_text: string;
        type_name: string;
        position: number;
      }>;
    };
    total_row_count: number;
    total_byte_count: number;
    truncated: boolean;
  };
  result?: {
    row_count: number;
    data_array: string[][];
    next_chunk_index?: number;
    next_chunk_internal_link?: string;
  };
}

/** Parsed row as key-value pairs */
export type DatabricksRow = Record<string, string | null>;
