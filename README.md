# bots-rodeo

An ActivityPub server-side bot framework 🤠

* Looks like [`sqlite3`](https://www.npmjs.com/package/sqlite3) is only being used in tests.
* `npx standard --fix` to enforce Javascript style and format code with [`standard`](https://www.npmjs.com/package/standard).
* To skip a test:
    ```js
    it('should return 200 OK', { skip: "Skip this test" }, async () => {
      assert.strictEqual(response.status, 200)
    })
    ```