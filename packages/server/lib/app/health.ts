import { controller, http } from "@fastr/controller";
import { Context } from "@fastr/core";
import { inject, injectable } from "@fastr/invert";
import Knex, { type Knex as KnexInstance } from "knex";

@injectable()
@controller()
export class HealthController {
  constructor(@inject(Knex) readonly knex: KnexInstance) {}

  @http.GET("/healthz")
  async health(ctx: Context) {
    await this.knex.raw("select 1");
    ctx.response.body = { status: "ok" };
  }
}
