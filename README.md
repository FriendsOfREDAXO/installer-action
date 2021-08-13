# installer-action
A GithubAction to upload github releases automatically into the REDAXO installer



# Usage

Add your MyREDAXO credentials to your repository secrets. ([GitHub Docs](https://docs.github.com/en/actions/reference/encrypted-secrets#creating-encrypted-secrets-for-a-repository)).

Set your myREDAXO username as value for `MYREDAXO_USERNAME` and your myREDAXO apikey as value for `MYREDAXO_API_KEY`.

Create a new release workflow file in your repository e.g. `.github/workflows/publish-to-redaxo.yml`

```yaml
name: Publish release

on:
  release:
    types:
      - published

jobs:
  redaxo_publish:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - uses: FriendsOfREDAXO/installer-action@1.0.0
      with:
        myredaxo-username: ${{ secrets.MYREDAXO_USERNAME }}
        myredaxo-api-key: ${{ secrets.MYREDAXO_API_KEY }}
        description: ${{ github.event.release.body }}
        
```

As soon as you publish a new version on GitHub, this workflow is triggered and your AddOn is uploaded to myREDAXO.
