import type {
  DatabricksStatementRequest,
  DatabricksStatementResponse,
  DatabricksParameter,
  DatabricksRow,
} from "./types.js";

/**
 * HTTP client for Databricks SQL Statement Execution API 2.0
 * Isolated infrastructure concern — use cases never touch this directly.
 *
 * @see https://docs.databricks.com/api/workspace/statementexecution/executestatement
 */
export class DatabricksClient {
  private readonly baseUrl: string;
  private readonly token: string;
  private readonly warehouseId: string;
  private readonly catalog: string;
  private readonly schema: string;

  constructor(config: {
    host: string;
    token: string;
    warehouseId: string;
    catalog: string;
    schema: string;
  }) {
    this.baseUrl = config.host.replace(/\/$/, "");
    this.token = config.token;
    this.warehouseId = config.warehouseId;
    this.catalog = config.catalog;
    this.schema = config.schema;
  }

  /**
   * Execute a SQL statement against the Databricks SQL Warehouse.
   * Returns parsed rows as key-value objects.
   */
  async executeStatement(
    sql: string,
    parameters?: DatabricksParameter[]
  ): Promise<DatabricksRow[]> {
    const body: DatabricksStatementRequest = {
      statement: sql,
      warehouse_id: this.warehouseId,
      catalog: this.catalog,
      schema: this.schema,
      parameters,
      wait_timeout: "30s",
      disposition: "INLINE",
      format: "JSON_ARRAY",
    };

    const response = await fetch(
      `${this.baseUrl}/api/2.0/sql/statements`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new DatabricksError(
        `Databricks API error (${response.status}): ${errorText}`,
        response.status
      );
    }

    let result = (await response.json()) as DatabricksStatementResponse;
    const statementId = result.statement_id;

    // Wait/poll if statement is still executing (e.g. warehouse cold start)
    let attempts = 0;
    while (
      (result.status.state === "PENDING" || result.status.state === "RUNNING") &&
      attempts < 30
    ) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      attempts++;

      const pollResponse = await fetch(
        `${this.baseUrl}/api/2.0/sql/statements/${statementId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        }
      );

      if (pollResponse.ok) {
        result = (await pollResponse.json()) as DatabricksStatementResponse;
      }
    }

    if (result.status.state === "FAILED") {
      throw new DatabricksError(
        `Statement failed: ${result.status.error?.message ?? "Unknown error"}`,
        500,
        result.status.error?.error_code
      );
    }

    if (result.status.state !== "SUCCEEDED") {
      throw new DatabricksError(
        `Unexpected statement state: ${result.status.state}`,
        500
      );
    }

    return this.parseResult(result);
  }

  /**
   * Parse Databricks response into row objects
   */
  private parseResult(response: DatabricksStatementResponse): DatabricksRow[] {
    if (!response.manifest || !response.result) {
      return [];
    }

    const columns = response.manifest.schema.columns;
    const rows = response.result.data_array;

    return rows.map((row) => {
      const obj: DatabricksRow = {};
      columns.forEach((col, idx) => {
        obj[col.name] = row[idx] ?? null;
      });
      return obj;
    });
  }
}

/**
 * Custom error class for Databricks API errors
 */
export class DatabricksError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly errorCode?: string
  ) {
    super(message);
    this.name = "DatabricksError";
  }
}
