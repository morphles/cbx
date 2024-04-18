function cbx( customConstraints = {}, debounceTime = 10 ){
    const cPrfx = 'cbx';
    function findNodes( selector, root ){
        return [ ...( root || document ).querySelectorAll( selector ) ];
    }
    function b( f, ...args ) {
        return f.bind( null, ...args );
    }

    //constraints are functions taking 2 arguments, node list on which check will be performed, reference value
    //(elements, reference) => [<if constraint violated>, <violation>]; Returning violation for use in messages
    const constraints = Object.fromEntries( [].concat(
        [ [ "regex", ( els, ref ) => ( el => [ !!el, el?.value ] )( els.find( el => !el.value.match( new RegExp( ref ) ) ) ) ], ],
        [
            [
                "Set",
                ( op, els, ref ) => ( cnt => [ op( cnt, +ref ), cnt ] )(
                    [].filter.call(
                        els[ 0 ]?.options || els, 
                        function isSet( { value, checked, selected } ) { return value && ( checked || selected ); }
                    ).length
                )
            ],
            [ "Empty", ( op, els, ref ) => ( cnt => [ op( cnt, +ref ), cnt ] )( els.filter( ( el => !el.value ) ).length ) ],
            [ "TextLength", ( op, els, ref ) => ( cnt => [ op( cnt, +ref ), cnt ] )( els.reduce( ( len, el ) => len + el.value.length, 0 ) ) ],
            [
                "Value",
                ( op, [ first, ...els ], ref ) => [
                    ref !== undefined && op( ref, first.value ) || els.some( el => op( el.value, first.value ) ),
                    first.value
                ],
            ],
            [
                "Number",
                ( op, [ first, ...els ], ref ) => [
                    ref !== undefined && op( +ref, +first.value ) || els.some( el => op( +el.value, +first.value ) ),
                    first.value
                ],
            ],
        ].flatMap( ( [ c, f ] ) => [
            [ `min${ c }`, b( f, o( "<" ) ) ],
            [ `max${ c }`, b( f, o( ">" ) ) ],
            [ `eq${ c }`, b( f, o( "!=" ) ) ],
        ] ),
    ) );

    function o( op ) { // cause why not have operators be something special eh? Who needs functions....
        switch( op ) {
            case "<": return ( a, b ) => a < b;
            case ">": return ( a, b ) => a > b;
            case "!=": return ( a, b ) => a != b;
        }
    }

    /** 
     * Check cbx constraint against targeted field(s), makes cbx visible if constraint fails, setting its html to configured message.
     * @param {Event} ev - triggering event
     * @param {Element} cbx - cbx for which to check constraint
     * @returns {Element} cbx
     */
    function check( ev, cbx ){
        const { selectors, constraint, param, message } = cbx.dataset;
        const [ failed, violation ] = (
            customConstraints[ constraint ] || constraints[ constraint ] || ( () => null )
        )(
            selectors.split( ";" ).flatMap( sel => findNodes( sel ) ), param
        ) || ( console.log( "Unsupported constraint requested for: ", cbx ), [ true ] ); // comma operator
        
        if( failed && message ){
            cbx.innerHTML = message.replace( '%value%', violation );
        }
        if( !failed || cbx.matches( `.${ cPrfx }--insta` ) || ev.type !== "input" ){ //insta-hide if valid, always
            cbx.classList.toggle( `${ cPrfx }--visible`, failed );
        }
        return cbx;
    }

    function top( el ){ // given cbx find top most ancestor that is also cbx, or just original el if none found.
        return el && top( el.parentNode.closest( `.${ cPrfx }` ) ) || el;
    }

    /**
     * Find all cbx related to field. Ether directly targeted by cbx selector or "in hierarchy" with it -
     * meaning is/has common cbx ancestor.
     * @param {HTMLElement} field
     */
    function findDependants( field ){
        return findNodes( `.${ cPrfx }` )
            .filter( cbx => field.matches( ( cbx.dataset.triggers || cbx.dataset.selectors ).replace( ";", "," ) ) )
            .flatMap( cbx => ( topCbx => findNodes( `.${ cPrfx }`, topCbx ).concat( topCbx ) )( top( cbx ) ) )
        ;
    }

    let lastTarget, tOut;
    /**
     * Listenend on input/change, checks all constraint boxes targeting the field @see findDependants .
     * Special radio handling, since changing one changes another, so we need to check other radios with same name too.
     * We have a debounce built in, since we listen for both change and input, and for say checkboxes/radios they both fire on click
     * this helps to not "double validate".
     * @param {Event} ev 
     */
    function dispatcher( ev ){
        const field = ev.target;
        if ( lastTarget == field && tOut ) {
            clearTimeout( tOut );
        }
        lastTarget = field;
        tOut = setTimeout(
            () => {
                tOut = lastTarget = null;
                return Array.from( new Set(
                    ( field.type !== "radio" ? [ field ] : [ ...field.form[ field.name ] ] ).flatMap( findDependants )
                ) ).map( b( check, ev ) );
            },
            debounceTime
        );
    };

    /**
     * Listener for form submission or button with 'data-click-validates="<field targeting selector>"'.
     * Validate all/targeted fields, prevent submission/propagation if have visible error cbx, scroll to top most.
     * @param {Event} ev
     */
    function stopOnBrokenConstraints( ev, fields ){
        const visibleErrorTops =
            Array.from( new Set( fields.flatMap( findDependants ) ) )
            .map( b( check, ev ) )
            // offsetParent for real visibility; when nesting parent valid, invalid child must not matter.
            .filter( cbx => cbx.offsetParent && cbx.matches( `.${ cPrfx }--error`) )
            .map( cbx => cbx.getBoundingClientRect().top );

        if( visibleErrorTops.length ){
            ev.stopPropagation();
            ev.preventDefault();
            window.scroll( 0, Math.min( ...visibleErrorTops ) ); //top of top most visible cbx
        }
    };

    Object.entries( {
        input:dispatcher,
        change:dispatcher, //cause 'input' will be ignored for non --insta show/display
        submit:( ev ) => stopOnBrokenConstraints( ev, findNodes( "input, textarea, select", ev.target ) ),
        click:( ev ) => ev.target.dataset.clickValidates === undefined // for AJAX or similar, that need to validate some things
            || stopOnBrokenConstraints( ev, findNodes( ev.target.dataset.clickValidates ) ),
    } ).map( ( [ ev, func ] ) => document.addEventListener( ev, func, true ) );

    findNodes( `.${ cPrfx }--initial` ).map( b( check, {} ) ); //some (mainly counter-likes), shoul be visible from start
    ( new CSSStyleSheet() )
        .replace( `.${ cPrfx }:not( .${ cPrfx }--visible ) { display: none !important; }` )
        .then( sheet => document.adoptedStyleSheets.push( sheet ) );
};
