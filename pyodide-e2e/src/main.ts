declare var loadPyodide: () => Promise<any>;

async function main() {
  let pyodide = await loadPyodide();
  console.log(pyodide.runPython("1 + 2"));
}
main();
