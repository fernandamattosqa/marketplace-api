const { Before, After } = require("@cucumber/cucumber");
const { criarServidor } = require("../../../mock-marketplace-api");

Before(async function () {
  this.server = criarServidor();
  await new Promise((resolve) => this.server.listen(0, resolve));
  const port = this.server.address().port;
  this.baseUrl = `http://127.0.0.1:${port}`;
  this.currentCartId = null;
  this.lastResponse = null;
});

After(async function () {
  if (this.server) {
    await new Promise((resolve) => this.server.close(resolve));
  }
});
