import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  Renderer2,
  ViewEncapsulation,
} from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { fromEvent, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { BasePageComponent } from './pages/page/page.component';

@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomepageComponent implements OnInit, OnDestroy, AfterViewInit {
  isSidebarOpened = true;
  previousWidth: number;
  contentRef: HTMLElement;
  isMarkupReady: boolean;

  private scrollSubscription: Subscription;
  private readonly scrollDebounceTime = 100;

  constructor(
    private readonly cd: ChangeDetectorRef,
    private readonly router: Router,
    private readonly elementRef: ElementRef,
    private readonly renderer: Renderer2,
  ) {}

  ngOnInit(): void {
    this.router.events
      .filter(e => e instanceof NavigationEnd)
      .subscribe(() => {
        if (window.innerWidth > 768) {
          return false;
        }
        this.isSidebarOpened = false;
        this.cd.detectChanges();
      });

    this.scrollSubscription = fromEvent(window, 'scroll')
      .pipe(debounceTime(this.scrollDebounceTime))
      .subscribe(_ => {
        this.checkViewportBoundaries();
      });
  }

  ngAfterViewInit() {
    this.checkWindowWidth(window.innerWidth);
  }

  ngOnDestroy() {
    this.scrollSubscription.unsubscribe();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.checkWindowWidth(event.target.innerWidth);
  }

  toggleSidebar() {
    this.isSidebarOpened = !this.isSidebarOpened;
  }

  checkWindowWidth(innerWidth?: number) {
    innerWidth = innerWidth ? innerWidth : window.innerWidth;
    if (this.previousWidth !== innerWidth && innerWidth <= 768) {
      this.previousWidth = innerWidth;
      this.isSidebarOpened = false;
      this.cd.detectChanges();
    }
  }

  checkViewportBoundaries() {
    const nativeElement: HTMLElement = this.elementRef.nativeElement;
    const footerRef: HTMLElement = nativeElement.querySelector('app-footer');
    const newsletterRef: HTMLElement = nativeElement.querySelector(
      '.newsletter-wrapper',
    );
    const carbonRef = nativeElement.querySelector('#carbonads');
    if (!footerRef || !carbonRef) {
      return;
    }
    if (window.innerWidth < 768) {
      this.renderer.removeStyle(carbonRef, 'position');
      this.renderer.removeStyle(carbonRef, 'bottom');
      return;
    }

    const isPositionFixed =
      window.pageYOffset + window.innerHeight <
      newsletterRef.offsetTop -
        footerRef.offsetHeight +
        newsletterRef.offsetHeight;

    if (!isPositionFixed) {
      this.renderer.setStyle(carbonRef, 'position', 'absolute');
      this.renderer.setStyle(carbonRef, 'bottom', '350px');
    } else {
      this.renderer.removeStyle(carbonRef, 'position');
      this.renderer.removeStyle(carbonRef, 'bottom');
    }
  }

  onRouteActivate(component: BasePageComponent) {
    if (!component) {
      return;
    }
    const nativeElement = component.nativeElement;
    if (!nativeElement) {
      return;
    }
    this.contentRef = nativeElement.querySelector('.content');
    if (this.contentRef && !this.contentRef.querySelector('.carbon-wrapper')) {
      const scriptTag = this.createCarbonScriptTag();
      const carbonWrapper = document.createElement('div');
      carbonWrapper.classList.add('carbon-wrapper');
      carbonWrapper.prepend(scriptTag);

      this.contentRef.prepend(carbonWrapper);
    }
    this.cd.markForCheck();
  }

  createCarbonScriptTag(): HTMLScriptElement {
    const scriptTag = document.createElement('script');
    scriptTag.type = 'text/javascript';
    scriptTag.src =
      '//cdn.carbonads.com/carbon.js?serve=CK7I653M&placement=nestjscom';
    scriptTag.id = '_carbonads_js';
    return scriptTag;
  }
}
