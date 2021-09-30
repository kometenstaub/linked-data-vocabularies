## Obsidian Linked Data Vocabularies Plugin

This plugin adds YAML keys for the selected heading, url (optional), and broader, narrower and related headings.

Currently, the LCSH [Suggest2](https://id.loc.gov/techcenter/searching.html) API is implemented.

See [@brimwats](https://github.com/brimwats)’ [explanation](#explanation-of-linked-data) to understand linked data better.

### Usage

In the editor, open the command palette and execute the `LCSH` command. Alternatively, you can set a hotkey for it.

If there is no YAML block present, a new one will be created. If there is already YAML present, the new YAML will be appended to the current YAML.

### Configuration

You can set the limit of queries to be display. 10 is the default setting.

You can set the key names for `heading`, `broader`, `narrower` and `related` in the settings.

Furthermore, you can set the search type. 

> Left anchored searches are ordered alphabetically, case and diacritic insensitive.
>
>Keyword searches are in descending relevance order, using the same search ranking as the main search page.
> 
><cite>[Source](https://id.loc.gov/techcenter/searching.html)</cite>

The default search type is `keyword`.

From my experience, keywords gives better results, but only gives good results when you type out the word fully. So `archeolo` wouldn't show `Archeology`, for that you need to type the full word.

You can also set a maximum number of headings to be added per type. The default value is 3. The larger you set it, the longer it will need to process.

### Modal

The Modal shows the heading in bold, under it, it shows the aLabel and if existing, the vLabel.

> aLabel will only return a resource whose authoritative label exactly matches the searched term. For example, aLabel:"International librarianship".
>
> vLabel will only return a resource which has a variant label exactly matching the searched term. For example, vLabel:"Librarianship, International".
> 
><cite>[Source](https://id.loc.gov/techcenter/searching.html)</cite>


### Recommendation

Use this plugin with [Breadcrumbs](https://github.com/SkepticMystic/breadcrumbs). You can set the hierachies in its settings and will have a breadcrumbs view for navigating the heading hierarchy you create in your notes.

</br>

## Explanation of linked data

Thank you [@brimwats](https://github.com/brimwats) for this explanation on Linked Data!

### Introduction
This plugin allows the use of structured linked data vocabularies as metadata in Obsidian notes. There are some concepts that should be understood when using this plugin. There are two sections below, one for non-technical users and ones for technical users (those familiar with linked data).

### Technical Information

This plugin uses a JSON-based API to allow the browsing of linked data vocabularies constructed in SKOS. An endpoint must be provided. Local vocabularies are not supported, as an index would have to be built to implement fast parsing/a lookup table of some sort, and parsing the file would not work on mobile.

### Non-Technical Information

See another explanation [here](https://www.librarianshipstudies.com/2017/03/vocabulary-control.html?m=1) and [here](https://www.ala.org/alcts/resources/z687/skos).

When a cultural heritage institution like a library receives a new item, there are several steps that must be taken before it is made available. Most importantly, the item must be **cataloged** with **subject headings**. A **subject heading** is a term that is meant to serve as a keyword or topic explanation for the book. If you have ever used tags or keywords, you understand the purpose. **Cataloging** means that an item is given at least one a subject heading such as "Poodle" or (more often) multiple headings such as "1. Dogs" and "2. Poodles." 

While this might seem obvious when we speak of a “Poodle” or a “Labrador retriever” it gets vastly more confusing when trying to organize thousands or hundreds of thousands of items. And large institutions do this sort of thing everyday, so they have to be **positive** that all headings mean the same thing. Should a “labradoodle” (the offspring of a Labrador and a poodle) be considered a poodle or a Labrador for purposes of classification? What about a “Goldendoodle” (a golden retriever and a poodle)? How about a “Yorkipoo”? A “Pugapoo”? What about a “Cockapoo”, a “Maltipoo” or a “Poo-Shi”?  

Enter controlled vocabularies and information retrieval thesauri.

When most people think of thesauri they likely think of style thesauri, which includes websites like [Thesaurus.com](https://www.thesaurus.com/), or a books like _Rogets Thesaurus,_ which offer similar or dissimilar alternatives to a word or phrase. For the word “Information” Thesaurus.com offers synonyms “advice”, “clue”, or “data”, and antonyms “ignorance”, “question”, “silence”.

There are three basic rules that occur in thesauri are UF, BT/NT and RT.

1.  Use/Use For (USE/UF),
2.  Broader Terms and Narrower Terms (BT/NT), and
3.  Related Terms (RT).


#### USE/UF

According to the Library of Congress:
> USE references are made from an unauthorized or non-preferred term to an authorized or preferred heading. Under the heading referred to, the code UF (Used For) precedes the term not used… USE references are made from an unauthorized or non-preferred term to an authorized or preferred heading. Under the heading referred to, the code UF (Used For) precedes the term not used. The codes USE and UF function as reciprocals

This is the strictest of all the rules in a thesaurus. It tells the cataloger to use one word in place of another (USE FOR), or that the material that they are looking for is under a different term (USE).

For example:

**Cars (Automobiles)**
→ USE Automobile

**Automobiles**
→ UF Cars (Automobiles)

USE references are made from synonyms, variant spellings, variant forms of expression, alternate constructions of headings, and earlier forms of headings. USE references are also made when it has been decided that words should not be used as a heading even if the heading and the unused words are not truly synonymous.

#### Broader Term and Narrower Term

The abbreviations **BT** (broader term) and **NT** (narrower term) indicate hiararchy.

The code **BT** refers to the class of which the heading is a member. So Automobiles is a broader term for Volvos. Dogs is a broader term for Poodles.

The code **NT** refers a member of the class represented by the heading under which the **NT** appears. So Volvos are a narrower term of Automobiles. Poodles are a narrower term of Dogs.

The broadest (parent) terms tend to be incredibly vague ideas, like “Art”, which then generally need to be narrowed down more to be useful, so it will have muliple **NT**s, or narrower terms, such as

**Art**
→ **NT** Western Art
→ **NT** Indigenous Art
→ **NT** Asian Art
→ [etc.]

These **NT**s will often have further **NT**s, so 
Art
- **NT** Western Art 
    - **NT** Western Sculpture 
        - **NT** Modern Sculpture 
            - **NT** [etc.]

#### Related Terms
The abbreviation **RT** (Related Term), links two headings that are associated in some manner other than by hierarchy (**BT**s/**NT**s). For example,

Birds
→ **RT** Ornithology

Ornithology
→ **RT** Birds

In the most basic sense, **RT**s just assert that there are connections between the current subject term and another one. For a cataloger, this enables them to consider connected terms to catalog their material under. For a user, this allows them to check under both subject headings to ensure that they have reviewed all of the relevant information.

**RT**s allow broader information institutions to control terminology.


### Searching for vocabularies:

- You may search the Library of Congress Subject Headings (LCSH) here: [https://id.loc.gov/authorities/subjects.html](https://id.loc.gov/authorities/subjects.html)

- A repository of vocabularies exists here: https://lov.linkeddata.es/dataset/lov/ 
