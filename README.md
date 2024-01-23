# Overview

When you have to manage different types of devices with thin-edge, the way attributes are fetched and operations are processed may need to be implemented in differently depending on the hardware, the OS version and what's installed on it.

Not to mention that you might want to add new attributes to monitor and new operations to be made available, in which case you want a simple way in Cumulocity to add those modifications and deploy them on your devices.

This is exactly what this project proposes to address by implementing "thin-edge profiles".

# Thin-edge profiles

A "thin-edge" profile is composed of 3 kind of elements:

- Categories: a category is a group in which you will put the 2 other kinds of elements;
- Properties: a property is either an attribute or a table that you will retrieve from the device, for example the IP address, or the list of network interfaces;
- Actions: an action is a Cumulocity operation that can be sent to the device either without context (for example the reboot operation), or with context (example: changing the hostname). An action can also apply to a line of table.

A thin-edge profile will be stored in the software repository of Cumulocity with the "tedge-profile" type, meaning you will also need to tedge-profile software management plugin to be installed on thin-edge to deploy your profiles. This plugin is presented in the next section.

## Categories

Categories are used to categorize the properties and actions.

![](./Capture%20web_23-1-2024_155243_lora-dev.cumulocity.com.jpeg)

## Properties

A property is used to retrieve information from a device.
It has the following attributes:

- Property name: this is the unique id of the property
- Property label: this is the label of the property that will be displayed
- Property categories: the list of categories in which this property will be displayed
- Property description: description of this property
- Store property value: deprecated
- JSON format: whether this property should return a simple value or a json table
- Property script: shell script to retrieve this property value

It is possible to change the order of the parameters by dragging and dropping them.

When the profile will be deployed on the device, the tedge-profile management plugin will update the inventory.json file and publish it to Cumulocity to update the device attributes in the inventory.

Example of simple property:

![](./Capture%20web_23-1-2024_155348_lora-dev.cumulocity.com.jpeg)

Example of table propery:

![](./Capture%20web_23-1-2024_155430_lora-dev.cumulocity.com.jpeg)

## Actions

Actions are used to define the operations supported by the device.

Actions have the following attributes:

- Action id: unique id of this action
- Action name: label of this action that will be displayed
- Apply on table rows: whether this action should apply to a row of a table or not. If it is false, the action will be available as a button at the top of each categories it belongs to, if it true it will appear on the last column of each row of the table it applies to
- Requires confirmation: whether to display a confirmation popup or not when performing that action
- Select a table: dropdown available only when "apply on table rows" is selected. This will display the list of properties that has "JSON format" set to true
- Action categories: the list of categories in which this action will be available when it does not apply to a table
- Action script: script that will process this operation. It can be written in any script language available on the device, using the right header. Parameters will be passed as env variables.
- Parameters: parameters that will passed to this action. Parameters have an id and a name and can have the following types:
  - STRING
  - INTEGER
  - FLOAT
  - BOOL
  - DATE
  - ENUM: in this case you will be able to enter the list of possible values as strings.
- Groups: groups are special parameters that are used to group parameters. They have the following attributes:
  - Group id: unique id of the group
  - Group name: label of the group
  - Repeatable: whether there can be multiple occurences of this group
  - Min occurences: only available when repeatable is true
  - Max occurences: same as above
  - Depends on param: this group will appear in the form only if the parameter it depends on will have a specific value
  - Param id: only available when "depends on param" is true, this is the id of the param this group visibility depends on
  - Param value: value that the parameter this group depends on must have in order for this group to be displayed
  - Parameters: list of parameters in this group

It is possible to change this order of the actions and their parameters by dragging and dropping them.

![](./Capture%20web_23-1-2024_155658_lora-dev.cumulocity.com.jpeg)

# deploying the profile

Thin-edge profiles are stored in the software repository with tedge-profile type.

To deploy a profile you therefore simply use the standard software management feature of Cumulocity.

# Device detail view

In the device detail view, a new tab "thin-edge" will appear. This view will be composed of horizontal tabs, one for each category, and in each category you will find your properties and actions.

If a property is a table, it will automatically be formatted as a Cumulocity NGX table component, and any contextual action will be available on the right end column.

Actions will be available whether as buttons or actions on table rows.
If an action has parameters, a form will be displayed.

When an action completes, a popup will immediately appear informing you of the result of the action. Since actions are implemented as operations they are also available in the "Control" tab of the device.

Example of the "General" category tab with only simple properties:

![](./Capture%20web_23-1-2024_1682_lora-dev.cumulocity.com.jpeg)

Example of the "Network" category tab with the network interfaces table:

![](./Capture%20web_23-1-2024_16822_lora-dev.cumulocity.com.jpeg)

Example of an action with parameters targetting a line of a table:

![](./Capture%20web_23-1-2024_1690_lora-dev.cumulocity.com.jpeg)

# The tedge-profile software plugin

## Introduction

The tedge-profile software plugin is a Python3 script that follows the specs as defined in thin-edge documentation: https://thin-edge.github.io/thin-edge.io/extend/write-my-software-management-plugin/

The script is packaged as a deb file that can be really simply deployed on your thin-edge devices that as the apt plugin enabled.

If you need to perform any modification to the script, then simply keep the tree structure and run the build-plugin.sh script to build the deb file.

## Installation

Installation is rather straightforward: simply put the deb file in your Cumulocity software repository with apt type. You will then be able to install it on any thin-edge device that has the apt plugin enabled.

---

These tools are provided as-is and without warranty or support. They do not constitute part of the Software AG product suite. Users are free to use, fork and modify them, subject to the license agreement. While Software AG welcomes contributions, we cannot guarantee to include every contribution in the master project.

For more information you can Ask a Question in the [TECH Community Forums](https://tech.forums.softwareag.com/tag/Cumulocity-IoT).

Contact us at [TECHcommunity](mailto:Communities@softwareag.com?subject=Github/SoftwareAG) if you have any questions.
