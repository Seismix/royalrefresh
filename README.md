# RoyalRecap

A web extension for [royalroad.com](https://royalroad.com). For people who juggle multiple stories.

## Why?

I've been an avid reader on [royalroad.com](https://royalroad.com) for over 4 years and like many others, I juggle
multiple stories at the same time. At some point this got somewhat unmanagable and often I drew a blank when thinking
about what happened in the last chapter of the story I just opened. More and more I found myself having to go back one
chapter and scroll all the way down just to re-read the last few paragraphs as a refresher. This is especially annoying
while on mobile, where I often read while on the train.

That's when decided on trying to implement this little idea of a small recap function, or if that was not possible, at
least a way to stop navigating to the previous chapter every time.

## What is it?

RoyalRecap is a browser extension ([only for Firefox at the moment](https://github.com/Seismix/RoyalRecap/issues/5))
that inserts a button next to RoyalRoad's "Reader Preferences" button. When clicked, the last few paragraphs of the
previous chapter get fetched and displayed at the top of the chapter, which you can toggle on and off using the button.
The extension defaults to showing you the last 250 words of the previous chapter (adjustable in extension settings,
[see Settings](#settings)).

Here's an example of what it looks like:

![Recap example](docs/recap_example.png)

## Settings

The extension comes with a settings page where you can adjust the recap length and other settings. To access it, click
on the RoyalRecap extension icon in the browser toolbar. The settings page will open in a new tab:

![Settings page](docs/basic_settings.png)

Advanced users can take advanced of the "Advanced options" toggle to reveal more settings. In case the website gets an
update, the user can adjust the CSS selectors to make the extension work again, until a new update of RoyalRecap is
released with the adjusted defaults:

![Advanced settings](docs/advanced_settings.png)

## TODOs

This extension is still a work in progress. If you have a good idea, you can create a new issue to describe
it/contribute and I will consider it. Here's a few examples of what I have planned:

- [ ] [#5](https://github.com/Seismix/royalrecap/issues/5): Cross browser compatibility
- [ ] [#40](https://github.com/Seismix/royalrecap/issues/40): Make the recap visually more separate from the chapter content

Check out everything I'm tracking in this project's [issues](https://github.com/Seismix/royalrecap/issues/).

## Contributing and bug reports

This is my first public repo, for now and until changes are needed, just create a issue with an appropriate label and a
descriptive message and I will take a look. Any contributions are welcome, issues where I specifically need help are
marked with the `contributions welcome` label.
