# CBX
ConstraintBoXes - vanillaJS flexible, extensible form validation (& more) library, no code needed (mostly, apart from HTML and custom constraints if any).

CBX is a small library (<1.5k gziped), mainly targeting form validation, that "inverts" how/where validation is defined allowing for more flexibility while reducing code. We define constraints not on input fields directly, but on separate message boxes (`class="cbx"`). This enables flexible placement and styling of messages. CBX also supports constraints spanning multiple fields and easy (no code) `&&` of constraints. Message boxes can be errors, that prevent form submission or click handlers on configured buttons.

__TL;DR__

```html
<div>
    <input type="number" name="minPlayers" id="minPlayers"> -
    <input type="number" name="maxPlayers" id="maxPlayers">
</div>
<div>
    <div class="cbx " data-selectors="#minPlayers;#maxPlayers" data-constraint="minEmpty" data-param="1">
        <div class="cbx cbx--error"
             data-selectors="#minPlayers;#maxPlayers"
             data-constraint="minNumber"
             data-message="Minimum players must be less than maximum!"></div>
    </div>
    <div class="cbx cbx--error"
         data-selectors="#minPlayers;#maxPlayers"
         data-constraint="maxEmpty"
         data-param="1"
         data-message="Please provide at least some information about min or max players!"></div>
</div>
```

```html
<div id="catBoxes">
    <label> <input type="checkbox" name="category" value="Abstract Strategy" id="cat0"> Abstract Strategy </label> <br/>
    <...>
    <label> <input type="checkbox" name="category" value="Negotiation" id="cat6"> Negotiation </label> <br/>
</div>
<div>
    <div class="cbx cbx--error"
         data-selectors="[name=category]"
         data-constraint="minSet"
         data-param="1"
         data-message="Please, select at least one category!"></div>
</div>
```

## What is wrong with regular HTML validation?

It has some shortcomings:
- validation constraints/errors are attached to fields (this is biggest problem that is source of all other problems)
- it is hard to style errors or have custom placement/display for them
- some fields have extremely limited validation (i.e. checkboxes, radio buttons)
- often we want constraints spanning multiple fields, i.e. counting checkboxes, without `customValidity` that is not possible
- can't combine constraints without writing code (i.e. field1 can't be empty, but only if checkbox2 is selected)

## How CBX differs?
- validation constraints "are attached" to "error" messages and not fields
- this allows to place and style them freely, even having multiple insances of same constraint for say display near field and at the top form if desired
- constraint can span multiple fields
- this also means that simple things like counting checkboxes or options selected is indeed simple
- by nesting messages/constraints we can create more complex rules where error message appers only if multiple constraints are violated
- this also means that more complex cases can be covered without addional JS, i.e. say in form product description can be chosen to be text of file upload, and we want some min text length or file selected as appropriate for option chosen
- we can make some constraints "soft" i.e. not prevent form submission, maybe serving just as warning or...
- we can use it for things like say "text length counters" or other interactive uses, like say show different form section depending on earlier selections (constraint box contents can be anything)
- actually we can use it outside forms (still, constraints must target input/select/textarea)
- we can trigger validation and prevent handling on non submit buttons too, again without additional JS, just specifyng on buttons, elements for which constraints need to be validated when clicked

## How to use CBX?

Include cbx.js or cbx.min.js script and call the `cbx()` function for simple default case, most likely after page is fully loaded (as some messages/constraints may be marked as "initally evaluated"). CBX is now enabled on page and `cbx` classed "boxes" should now function.

So what are `cbx` classed "boxes"? Well basically any html tag that has `class="cbx"` though it needs to have correct `data-*` for it to do anything. Here is example with most of supported attributes:
```html
<div class="cbx cbx--error"
    data-constraint="minSet"
    data-param="3"
    data-selectors="#fieldset1 checkbox"
    data-message="Select at least 3 items! You have selected %value% items.">
```

- `data-constraint` specifies which constraint is evaluated by this `cbx`, in this case `minSet` counts number of set (selected/checked items, be it checkboxes or select options, constraints described later).
- `data-param` is parameter passed to constraint, it's meaning depends on constraint, in this case it is the minimum number of items set needed for constraint to not be violated (and thus box being shown).
- `data-selectors` is `;` separated list of CSS selectors targeting elements for which constraint will be applied. Since in CSS you can not get specific order of elements (via say `,` selector, which of course works here), we use `;` when constraint needs elements in specific order, elements found by selectors separated by `;` will be passed to constraint in "specification order". In this case we are just targeting all checkboxes in element with id fieldset1. Normally change/input (depending on CSS/BEM modifier classes, more on that later) to targeted inputs will cause constraint to be recalculated and box ether hidden or shown if violated (depending on classes, see below).
- `data-message` is message that will be put inside (as innertHTML) the `cbx` itself if it's constraint fails/is violated. It supports single placeholder `%value%` which is replaced by violation value returned by constraint being violated. It can be skipped, then inside of `cbx` is not replaced during violation, and such `cbx` can just show/hide it's contents based on constraint violation, you can put anything in there, if you put another `cbx`(es) that effectively functions as `&&` of constraints, as inner ones will only be shown if outer one(s) are also shown/violated.
- `data-triggers` can be another list of selectors, that will be used to trigger validation of constraint instead of `data-selectors`, it is useful UX-wise to sometimes have narrower triggering set than targeting set, this allows to achieve that.

Some aspects of `cbx` are also configured by CSS/BEM modifier classes.
- `cbx--error` is most important, as it is needed for constraint violation to be considered error, and thus prevent form submission (more on how that is handled later). If it is skipped `cbx` is only toggling visbility, thus it can be used as sorta "togglable container", for other UI elements, descriptions, helps or other `cbx`(es) to `&&` their constrains. Note if using nested `cbx` only the inner most one(s) should have `cbx--error` as visible errors prevent submission, even if empty so outer `cbx` should not be error otherwise it by itself will prevent submission thus not workign as `&&`!
- `cbx--insta` can be used to controll when `cbx` becomes visible if constraint is violated. Normally we do not want to be too disruptive to user and only show violations on `change` events so that if we say have minimum text lenght constraint, we do not show lenght error just as user starts to type. In some cases however we want such instant display and adding this class allows `cbx` to become visible immediatly visible when constraint is violated. We can use `cbx--insta` without `cbx--error` and with constraint that is always violated to act as realtime counter of say text in input or number of checkboxes checked (see examples link below).
- `cbx--initial` is used to mark certain `cbx`(es) to be validated immediatly as CBX loads, most likely to be used with `cbx--insta` based counters as described above. This is the reason why you might want to call `cbx()` only after everything is fully loaded, since if elements with `cbx--initial` appear after call to `cbx()` they will not be validated immediatly.
- `cbx--visible` should likely not be used manually, it is a class that is set by CBX when constraint is violated and it makes the `cbx` visible, still potentially in some cases maybe one might want to use it instead of `cbx--initial` (this for example would allow having unique message in box before constraint is ever evaluated and message replaced with `data-message`).

Separate validation run happens on attempted form submit, CBX then checks constraints targeting any field within form and if any of `cbx--error` targeting form field(s) become visible form submission is prevented. We also support simillar for "AJAX" type of situation, if we have some button (or any element really) with `data-click-validates` attributed containing selector targeting some fields (use `,` to target different elements), CBX will assume that selectors are for fields that might be targeted by some `cbx`(es) and will validate them, and prevent click handling if this results in some `cbx--error` being visible. In both cases (form submission and custom validation), we scroll view to top most visible `cbx--error`. Also again for both cases, placement of `cbx`(es) is fully independent of targeted fields, they can be outside the form itself for example.


## Constraints

### Built in constraints for use in `data-constraint`:

- `minSet`, `maxSet`, `eqSet` - count "set items" (checkboxes, radios, `option`s in `select`), uses `data-param` as reference, so `data-constraint="minSet" data-param="3"` will be violated if number of set items is `<3`, for `maxSet` it would be `>3`, and for `eqSet` - `!=3`
- `minEmpty`, `maxEmpty`, `eqEmpty` - count empty items compare to `data-param` as above. Empty items will be anything that is without "truthy" value (JS `!value`)
- `minTextLength`, `maxTextLength`, `eqTextLength` - counts text length (summing across all targeted elements) and compares against `data-param`, if  you want to use for rich editors like CKEditro, TinyMCE etc., I suggest using hidden `textarea` and ensuring editor keeps it updated and fires change/input event on it as apropriate.
- `minNumber`, `maxNumber`, `eqNumber` - compare first element targeted by `data-selectors` (this is where you likely want to use `;` to get explicit order of returned elements) to others and `data-param`; for `minNumber` it will be violated if first elements value converted to number (JS `+`) is not smaller then all the rest (again converted to numbers); `maxNumber` if it's not largest; `eqNumber` if it is not equal to all.
- `minValue`, `maxValue`, `eqNumber` - same as above, but without conversion to number. This means it can be used to compare say date or time fields, as in JS those are sane formats, i.e. ISO date and 24h time, meaning regular string comparision works as valid value comparision. Very usefull if we need elements to select some time range and want to make sure start of range is before end.
- `regex` - takes regular expression in `data-param` and is violated it at least one targeted `input`s value does not match the given expression.

### Custom constraints:

When calling `cbx()` to set it up, first argument can be object whose methods will be custom constraints that can be used in `data-constraint`, object is "live" (meaning that we store reference and if new methods are added/changed at run time they will work without any recalls of `cbx()` [in fact it should never be called more than once!]). Constraints have simple signature:

```
    ( elements, reference ) => [ violated, violation ]
```

- `elements` will be elements matched by `data-selectors` (again if it is using `;` order will be preserved)
- `reference` will be what is in `data-param`

it should return array with two elements:
- `violated` if constraint was violated (if true `cbx--visible` class will be set on `cbx` box making it visible)
- `violtion` value that will be used to replace `%value%` within `data-message`

## Example use

[Here](https://morphles.github.io/cbx/) is example page where "almost anything" interactive is done using CBX only. You can click show code buttons in fieldsets to see HTML that was used to generate it and how CBX was used there.

## Support

If you like and use the library consider supporting me on <https://buymeacoffee.com/morphles>
