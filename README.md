# cbx
ConstraintBoXes - vanillaJS flexible, extensible form validation ( & more) library, no code needed (well apart from HTML).

CBX is a small library, mainly targeting form validation, that "inverts" how/where validation is defined allowing for more flexibility with less code.

__TL;DR__

```html
<div>
    <input type="number" name="minPlayers" id="minPlayers"> -
    <input type="number" name="maxPlayers" id="maxPlayers">
</div>
<div>
    <div class="cbx " data-selectors="#minPlayers;#maxPlayers" data-constraint="minEmpty" data-param="1">
        <div class="cbx cbx--error" data-selectors="#minPlayers;#maxPlayers" data-constraint="minNumber" data-message="Minimum players must be less than maximum!"></div>
    </div>
    <div class="cbx cbx--error" data-selectors="#minPlayers;#maxPlayers" data-constraint="maxEmpty" data-param="1" data-message="Please provide at least some information about min or max players!"></div>
</div>
```

```html
<div id="catBoxes">
    <label> <input type="checkbox" name="category" value="Abstract Strategy" id="cat0"> Abstract Strategy </label> <br/>
    <...>
    <label> <input type="checkbox" name="category" value="Negotiation" id="cat6"> Negotiation </label> <br/>
</div>
<div>
    <div class="cbx cbx--error" data-selectors="[name=category]" data-constraint="minSet" data-param="1" data-message="Please, select at least one category!" ></div>
</div>
```

## What is wrong with regular HTML validation?

It has some shortcomings:
- validation constraints/errors are attached to fields (this is biggest mistake that is source of all other problems)
- it is hard to style errors or have custom placement/display for them
- some fields have extremely limited validation (i.e. checkboxes, radio buttons)
- often we want constraints spanning multiple fields, i.e. counting checkboxes, without `customValidity` that is not possible

## How CBX differs?
- validation constraints "are attached" to "error" messages and not fields
- this allows to place and style them freely, even having multiple insances of same constraint for say display near field and at the top form if desired
- constraint can span multiple fields
- this means that simple thing of counting checkboxes or options selected is indeed simple
- by nesting messages/constraints we can create more complex rules where error message appers only if multiple constraints are violated
- this also means that more complex cases can be covered without addional JS, i.e. say in form product description can be chosen to be text of file upload, and we want some min text length or file selected as appropriate for option chosen
- we allow some constraints to be "soft" i.e. not prevent form submission, maybe serving just as warning or...
- this means we can use it for things like say "text length counters" or other interactive uses, like say show different form section depending on earlier selections (constraint box contents can be anything)
- actually we can use it outside forms (still, constraints must target input/select/textarea)
- we can trigger validation and prevent handling on non submit buttons too, again without additional JS, just specifieng on buttons, elements for which constraints need to be validated when clicked

