// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { isNil, get } from 'lodash';
import { JobEditPage } from './job-edit-page';
import { YamlEditPage } from './yaml-edit-page';
import { SubmissionSection } from './components/submission-section';
import { Flex } from './elements';
import { JobProtocol } from './models/job-protocol';
import { fetchJobConfig } from './utils/conn';
import PropTypes from 'prop-types';
import { Pivot, PivotItem } from 'office-ui-fabric-react';

const loginUser = cookies.get('user');

function getChecksum(str) {
  let res = 0;
  for (const c of str) {
    res ^= c.charCodeAt(0) & 0xff;
  }
  return res.toString(16);
}

function generateJobName(jobName) {
  let name = jobName;
  if (
    /_\w{8}$/.test(name) &&
    getChecksum(name.slice(0, -2)) === name.slice(-2)
  ) {
    name = name.slice(0, -9);
  }

  let suffix = Date.now().toString(16);
  suffix = suffix.substring(suffix.length - 6);
  name = `${name}_${suffix}`;
  name = name + getChecksum(name);
  return name;
}

const PureJobSubmissionPage = ({ onJobProtocolChange }) => {
  const [currentTabKey, setCurrentTabKey] = useState('ui');

  useEffect(() => {
    let suffix = Date.now().toString(16);
    suffix = suffix.substring(suffix.length - 6);
    let name = `${loginUser}_${suffix}`;
    name = name + getChecksum(name);

    onJobProtocolChange(
      new JobProtocol({
        name,
        defaults: { virtualCluster: 'default' },
        extras: {
          hivedScheduler: {
            taskRoles: { taskrole: { skuNum: 1, skuType: 'GENERIC-WORKER' } },
          },
        },
        prerequisites: [
          {
            type: 'dockerimage',
            uri: 'openpai/standard:python_3.6-pytorch_1.2.0-gpu',
            name: 'docker_image_0',
          },
        ],
        taskRoles: {
          taskrole: {
            completion: { minFailedInstances: 1 },
            dockerImage: 'docker_image_0',
            instances: 1,
            taskRetryCount: 0,
          },
        },
      }),
    );
  }, []);

  // fill protocol if cloned job or local storage
  useEffect(() => {
    const fillJobProtocol = jobConfig => {
      onJobProtocolChange(
        new JobProtocol({
          ...jobConfig,
          name: generateJobName(jobConfig.name),
        }),
      );
      if (get(jobConfig, 'extras.submitFrom')) {
        delete jobConfig.extras.submitFrom;
      }
    };
    const params = new URLSearchParams(window.location.search);
    if (params.get('op') === 'resubmit') {
      const jobName = params.get('jobName') || '';
      const user = params.get('user') || '';
      if (user && jobName) {
        fetchJobConfig(user, jobName)
          .then(jobConfig => fillJobProtocol(jobConfig))
          .catch(alert);
      }
    } else if (!isNil(window.localStorage.getItem('marketItem'))) {
      const jobConfig = JSON.parse(localStorage.getItem('marketItem'));
      fillJobProtocol(jobConfig);
      localStorage.removeItem('marketItem');
    }
  }, []);

  const getCurrentTabContent = current => {
    switch (current) {
      case 'yaml':
        return (
          <Flex flex={1} flexDirection='column'>
            <YamlEditPage />
          </Flex>
        );
      case 'ui':
      default:
        return (
          <Flex>
            <JobEditPage />
          </Flex>
        );
    }
  };

  const handleTabChange = item => {
    setCurrentTabKey(item.props.itemKey);
  };

  return (
    <Flex flexDirection='column' p='l1' height='100%'>
      <Pivot onLinkClick={handleTabChange}>
        <PivotItem headerText='Web UI' itemKey='ui' />
        <PivotItem headerText='YAML Config' itemKey='yaml' />
      </Pivot>
      {getCurrentTabContent(currentTabKey)}
      <Flex justifyContent='flex-end' pt='m' pb='m'>
        <SubmissionSection />
      </Flex>
    </Flex>
  );
};

const mapStateToProps = () => {};

const mapDispatchToProps = dispatch => ({
  onJobProtocolChange: jobProtocol =>
    dispatch({ type: 'SAVE_JOBPROTOCOL', payload: jobProtocol }),
});

export const JobSubmissionPage = connect(
  mapStateToProps,
  mapDispatchToProps,
)(PureJobSubmissionPage);

PureJobSubmissionPage.propTypes = {
  onJobProtocolChange: PropTypes.func,
};
