# \<oe-app-route\>

The `oe-app-route` element can be used to auto configure, application level client side routing.

```html
        <app-location route="{{route}}"></app-location>
        <oe-app-route route="{{route}}" config-url="/data/UIRoutes.json">
            <iron-pages route-target>
            </iron-pages>
        </oe-app-route>
```
OR
```html
        <app-location route="{{route}}"></app-location>
        <oe-app-route route="{{route}}" config-url="/api/UIRoutes">
        </oe-app-route>
        <iron-pages route-target>
        </iron-pages>
```

### Route Configuration

config-url should return array of routes, each route object can have following properties

Property |              Description      | Default
---------|-------------------------------|----------
`name`   | route name                    |
`path`   | relative url along with placeholders e.g. /customer/:id |
`type`   | refer section on [type and import Properties](#type-and-import-properties)        |
`import` | refer section on [type and import Properties](#type-and-import-properties)              |

e.g.

    [{
        "type": "page",
        "name": "receipts",
        "path": "/receipts",
        "import": "receipts-partial.html"
    },
    {
        "type": "elem",
        "name": "cfe-loan-details",
        "path": "/loan",
        "import": "../business/cfe-loan-details.html"
    }]

#### *type* and *import* Properties

> The *type* property can have following values:
>
> - **page** : When route type is specified as page, the html data from *import* is fetched and added as innerHtml of target element.
>  - If the *path* argument has any placeholders (e.g. execute/:modelName/:action) or actual URL has any query-string then the actual values can be referred in the imported html partial directly.
> ``` html
> <h2>Performing {{action}} on {{modelName}}</h2>
> ```
> - **elem** type of route places element specified by *name* property on hhe target. *import* property points to the location of element definition file.
>  - If element is not registered yet, *import* is href-imported and *name* element is added.
>  - Placeholders and query parameters are set on the element using `Polymer.base.set` call. (**id** in path or query-parameters is added as **modelId** attribute)
> ``` html
> <owesome-element action="..." model-name="..."></owesome-element>
> ```
>  - The element-name can be made dynamic by introducing **elmentName** as path parameter. e.g. */show/:elementName*
>  - **meta** : route types are not supported anymore.
> Use `model-ui-generator` as a mediator element for replacing old `meta` type of routes.
