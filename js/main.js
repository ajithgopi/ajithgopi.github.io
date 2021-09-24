$(document).ready(function() {
    $('[data-toggle="tooltip"]').tooltip();

    $('.popover-maxcinema').popover({
        html: true,
        placement: 'top',
        content: `<img width="100%" src='img/maxcinema.jpeg'>`
    });

    AOS.init();

    adjustLeftRightBarHeights();
});

$(window).resize(function() {
    adjustLeftRightBarHeights();
});

function filterItems(container, query) {
    total_items = $(container + " span").length
    visible_items = 0
    query = query.trim().toLowerCase().replace(" ", "")
    $(container + " span").each(function() {
        item_name = $(this).text().toLowerCase();
        tags = $(this).attr('data-tags')
        tags = (typeof tags === 'undefined') ? '' : tags = tags.toLowerCase();
        if (query == '' || item_name.includes(query) || tags.includes(query)) {
            $(this).fadeIn(300);
            visible_items++
        } else {
            $(this).fadeOut(300);
        }
    })
    if (visible_items == 0) {
        $(container + " .no-match").fadeIn(300);
    } else {
        $(container + " .no-match").fadeOut(300);
    }
}

function adjustLeftRightBarHeights() {
    $("#section-twitter").height($('#section-skills').height() + "px");
}