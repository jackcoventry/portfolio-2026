---
title: 'Signs you have a healthy codebase'
description: ''
pubDate: 'Jan 11 2026'
listingImage: '../../assets/mountains.webp'
duration: 5
---

I've seen many codebases over the years that come with a warning signs: "this one takes a while to get working", "don't touch that because the whole project will implode".

I always thought it was solely a symptom of working in lightning speed work environments - there's never enough time to do x, y or z - but sometimes it can happen to us all if we take our finger off the pulse. If you're starting a new project, or improving an existing one, bear these practices in mind to improve your codebase.

## Accessibility

A project without any consideration for accessibility is a giant red flag. One of the first things I do when testing a website is the most obvious, I try and use it with keyboard alone. If it doesn't have the basics, chances are it won't have anything else.

## Consistency

A project that has clear coding standards from the off is a great sign, so long as they're being followed. Linting rules can only take you so far - although they are effective - but having a team that sticks to plan is a really good sign that the codebase is looked after. In an ideal world, team members are in constant collaboration via peer reviewing and communication, so nothing radical should find itself in there without the team's blessing. If a new strategy is required then I would prefer to speak to all the time first.

## Testing

Unfortunately, unit testing is often one of the first things to be dropped if a project's resources are stretched. If they made it to project and are in good shape then that's a good sign. In an ideal scenario I would expect at least 75% code coverage on a project (based on Google's coverage principles) but that's not always the case, especially at the start of a project. Integration testing with more complex features would be great. Test coverage and new code still being tested is a good sign of a healthy codebase.

End-to-end testing is great, I would at least expect to see some basic smoke tests.

Visual regression is increasingly more accessible to projects, I like Chromatic but

## CI/CD quality gates

Humans make mistakes, computers make mistakes - but together they can act as a safety-net over your projects. Testing will catch a lot of stuff but not everything.

I like projects that have automated quality gates that don't feel like a chore. Having sensible Prettier and Linting rule go a long way.

I prefer pre-push hooks to pre-commit hooks, just because I like to encourage regular commits and sometimes it just isn't possible to fix any 'violations' in one commit. Any time I've used pre-commit hooks in a project, most people tend to commit less often or even worse, bypass the hook altogether. A better dev-first approach is to pre-push, because that assumes a certain level of completion before a pull request is made, the downside being slightly more risk of losing work.

Adding performance budgets to your project can work in some instances, although depending on the context it might not be suitable. Adding automated checks to make sure new packages or features aren't bloating your output is helpful

## Documentation

Onboarding + Good dev experience

I want developers to be onboarded very quickly. Gone all the days where it would take an entire week to get a project set-up on your laptop!!

I want developers to understand what is going on in the project but also not feel overwhelmed.

Coding should generally be self-documenting: naming conventions should be sensible and human readable by default and I think if you document every line of code you're just getting into diminishing returns. Breaking apart blocks of code with comments makes it harder to read.

For component-heavy projects, Storybook is a great environment to document your UI in a playable environment (among other many positives such as testing).

## Design system

A design system is about creating a shared decision 'dictionary' across your team. Design and development both read from the same source. When done correctly, they're a backbone to any healthy project but when done incorrectly it can cause more issues than it's worth.

I prefer dev's to have the control on what goes into a codebase but if it suits your project you could also hook something like Figma to your codebase to automatically generate your tokens.

Using semantic token names and helper classes is imperative to a consistent, healthy codebase

## Performance
