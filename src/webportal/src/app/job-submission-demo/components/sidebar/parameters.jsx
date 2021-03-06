// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { KeyValueList, getItemsWithError } from '../controls/key-value-list';
import { PROTOCOL_TOOLTIPS } from '../../utils/constants';
import { Box, Code } from '../../elements';
import { FormSection } from '../form-page';
import PropTypes from 'prop-types';
import { JobProtocol } from '../../models/job-protocol';

const PureParameters = ({ jobProtocol, onJobProtocolChange }) => {
  const { parameters } = jobProtocol;
  const [items, setItems] = useState([]);

  useEffect(() => {
    const newItems = [];
    if (Object.keys(parameters).length > 0) {
      for (const key in parameters) {
        newItems.push({ key: key, value: parameters[key] });
      }
    } else {
      newItems.push({ key: '', value: '' });
    }
    setItems(newItems);
    // setErrorMessage(ERROR_ID, null);
  }, [parameters]);

  const onListChange = newItems => {
    const itemsWithError = getItemsWithError(newItems);
    const idx = itemsWithError.findIndex(
      item => item.keyError || item.valueError,
    );
    if (idx === -1) {
      const newParameters = {};
      for (const item of itemsWithError) {
        newParameters[item.key] = item.value;
      }
      // update job protocol into store
      onJobProtocolChange(
        new JobProtocol({ ...jobProtocol, parameters: newParameters }),
      );
      // handleError(false);
      // setErrorMessage(ERROR_ID, null);
    } else {
      setItems(itemsWithError);
      // handleError(true);
      // setErrorMessage(ERROR_ID, `Invalid item ${idx}`);
    }
  };

  return (
    <FormSection title='Parameters' tooltip={PROTOCOL_TOOLTIPS.parameters}>
      <Box>
        <Box fontSize='s2'>
          You could reference these parameters in command by
          <Code color='dark-red' bg='black-05'>
            {'<% $parameters.paramKey %>'}
          </Code>
          .
        </Box>
      </Box>
      <Box>
        <KeyValueList items={items} onChange={onListChange} />
      </Box>
    </FormSection>
  );
};

const mapStateToProps = state => ({
  jobProtocol: state.JobProtocol.jobProtocol,
});

const mapDispatchToProps = dispatch => ({
  onJobProtocolChange: jobProtocol =>
    dispatch({ type: 'SAVE_JOBPROTOCOL', payload: jobProtocol }),
});

export const Parameters = connect(
  mapStateToProps,
  mapDispatchToProps,
)(PureParameters);

PureParameters.propTypes = {
  jobProtocol: PropTypes.object,
  onJobProtocolChange: PropTypes.func,
};
