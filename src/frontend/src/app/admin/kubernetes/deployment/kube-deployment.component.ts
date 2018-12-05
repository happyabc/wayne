import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { State } from '@clr/angular';
import { Subscription } from 'rxjs/Subscription';
import { DeploymentClient } from '../../../shared/client/v1/kubernetes/deployment';
import { PageState } from '../../../shared/page/page-state';
import { BreadcrumbService } from '../../../shared/client/v1/breadcrumb.service';
import { MessageHandlerService } from '../../../shared/message-handler/message-handler.service';
import { KubeListDeploymentComponent } from './list/kube-list-deployment.component';
import { ClusterService } from '../../../shared/client/v1/cluster.service';
import { DeploymentList } from '../../../shared/model/v1/deployment-list';
import { AdminDefaultApiId } from '../../../shared/shared.const';
import { AceEditorMsg } from '../../../shared/ace-editor/ace-editor';
import { AceEditorService } from '../../../shared/ace-editor/ace-editor.service';

const showState = {
  '名称': {hidden: false},
  '总量': {hidden: false},
  '回收策略': {hidden: true},
  '访问模式': {hidden: false},
  '状态': {hidden: false},
  '已绑定PVC': {hidden: false},
  '原因': {hidden: true},
  '开始时间': {hidden: false},
};

@Component({
  selector: 'kubernetes-deployment',
  templateUrl: './kube-deployment.component.html'
})
export class KubeDeploymentComponent implements OnInit {
  @ViewChild(KubeListDeploymentComponent)
  listDeployment: KubeListDeploymentComponent;

  namespace = 'default';
  cluster: string;
  clusters: Array<any>;
  changedDeployments: DeploymentList[];
  pageState: PageState = new PageState();
  subscription: Subscription;

  showList: any[] = Array();
  showState: object = showState;

  constructor(private breadcrumbService: BreadcrumbService,
              private deploymentClient: DeploymentClient,
              private clusterService: ClusterService,
              private route: ActivatedRoute,
              private router: Router,
              private aceEditorService: AceEditorService,
              private messageHandlerService: MessageHandlerService) {
  }

  initShow() {
    this.showList = [];
    Object.keys(this.showState).forEach(key => {
      if (!this.showState[key].hidden) {
        this.showList.push(key);
      }
    });
  }

  ngOnInit() {
    this.initShow();
    let cluster = this.route.snapshot.params['cluster'];
    this.clusterService.getNames().subscribe(
      response => {
        const data = response.data;
        if (data) {
          this.clusters = data.map(item => item.name);
          if (data.length > 0 && !this.cluster || this.clusters.indexOf(this.cluster) === -1) {
            cluster = cluster ? cluster : data[0].name;
          }
          this.jumpTo(cluster);
        }
      },
      error => this.messageHandlerService.handleError(error)
    );
  }

  jumpTo(cluster: string) {
    this.cluster = cluster;
    this.router.navigateByUrl(`admin/kubernetes/deployment/${cluster}`);
    this.retrieve();
  }

  detail(deploymentList: DeploymentList) {
    this.deploymentClient.get(AdminDefaultApiId, this.cluster, deploymentList.objectMeta.namespace, deploymentList.objectMeta.name)
      .subscribe(
        response => {
          const data = response.data;
          this.aceEditorService.announceMessage(AceEditorMsg.Instance(data, false, '详情'));
        },
        error => this.messageHandlerService.handleError(error)
      );
  }

  retrieve(state?: State): void {
    if (state) {
      this.pageState = PageState.fromState(state, {totalPage: this.pageState.page.totalPage, totalCount: this.pageState.page.totalCount});
    }
    if (this.cluster) {
      this.deploymentClient.listPage(this.pageState, this.cluster, this.namespace)
        .subscribe(
          response => {
            const data = response.data;
            this.pageState.page.totalPage = data.totalPage;
            this.pageState.page.totalCount = data.totalCount;
            this.changedDeployments = data.list;
          },
          error => this.messageHandlerService.handleError(error)
        );
    }
  }

}
