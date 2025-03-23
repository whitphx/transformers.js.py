## Development on browser

```
cd pyodide-e2e
pnpm dev
```

Open the page in a browser and open the developer console.

## Release

```
bump-my-version bump <version> --tag --commit --commit-args='--allow-empty'
git push
git push --tags
```
