import { Injectable } from "@angular/core";
import { CanActivate, ActivatedRouteSnapshot } from "@angular/router";
import { Observable } from "rxjs";

@Injectable({ providedIn: "root" })
export class TedgeGuard implements CanActivate {
  canActivate(
    route: ActivatedRouteSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    const contextData = route.data.contextData || route.parent.data.contextData;
    return contextData.c8y_Agent?.name == "thin-edge.io";
  }
}
