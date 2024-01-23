import { Injectable } from "@angular/core";
import { NavigatorNode, NavigatorNodeFactory, _ } from "@c8y/ngx-components";

@Injectable()
export class TedgeNavigationFactory implements NavigatorNodeFactory {
  nav: NavigatorNode[] = [];
  // Implement the get()-method, otherwise the ExampleNavigationFactory
  // implements the NavigatorNodeFactory interface incorrectly (!)
  constructor() {
    let sshDevices: NavigatorNode = new NavigatorNode({
      label: _("Thin-edge devices"),
      icon: "sensor",
      path: "/tedge-devices",
      priority: 1,
      routerLinkExact: false,
    });

    let sshProfiles: NavigatorNode = new NavigatorNode({
      label: _("Thin-edge profiles"),
      icon: "c8y-administration",
      path: "/tedge-profiles",
      priority: 2,
      routerLinkExact: false,
    });

    let loraNode: NavigatorNode = new NavigatorNode({
      label: _("Thin-edge"),
      icon: "wifi",
      name: "tedge",
      children: [sshDevices, sshProfiles],
      priority: 1,
      routerLinkExact: false,
    });

    this.nav.push(loraNode);
  }

  get() {
    return this.nav;
  }
}
