import React, { useState, useRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import { dragNodeService, selectNodeService } from './service'
import {  AccordionDetails, AccordionSummary, Avatar, Box, Card, CardActions, CardContent, Icon, Typography } from '@mui/material'
import { styled } from '@mui/material/styles'
import MuiAccordion from '@mui/material/Accordion'

const Accordion = styled(MuiAccordion)(({ theme }) => ({
  boxShadow: 'blue !important',
  width:'10rem',

  // backgroundColor: '#189ab4' ,
  // color:'white',
  border: `1px solid ${theme.palette.divider}`,
  '&:not(:last-of-type)': {
    borderBottom: 0
  },
  '&:before': {
    display: 'none',
    width:'13rem'
  },
  '&.Mui-expanded': {
    // margin: 'auto',
    // 
  },
  '&:first-of-type': {
    '& .MuiButtonBase-root': {
      borderTopLeftRadius: 8,
      borderTopRightRadius: 8
    }
  },
  '&:last-of-type': {
    '& .MuiAccordionSummary-root:not(.Mui-expanded)': {
      borderBottomLeftRadius: 8,
      borderBottomRightRadius: 8
    }
  }
}))

const propTypes = {
  datasource: PropTypes.object,
  NodeTemplate: PropTypes.elementType,
  draggable: PropTypes.bool,
  collapsible: PropTypes.bool,
  multipleSelect: PropTypes.bool,
  changeHierarchy: PropTypes.func,
  onClickNode: PropTypes.func
}

const defaultProps = {
  draggable: false,
  collapsible: true,
  multipleSelect: false
}

const ChartNode = ({
  datasource,
  NodeTemplate,
  draggable,
  collapsible,
  multipleSelect,
  changeHierarchy,
  onClickNode
}) => {
  const node = useRef()

  // const expandIcon = value =>
  console.log(datasource);
  
  // datasource.employees = datasource.employees.filter((employee)=>{
  //   return employee != undefined && employee?.firstName != undefined  && employee.lastName != undefined;
  // })
  
  const [isChildrenCollapsed, setIsChildrenCollapsed] = useState(false)
  const [topEdgeExpanded, setTopEdgeExpanded] = useState()
  const [rightEdgeExpanded, setRightEdgeExpanded] = useState()
  const [bottomEdgeExpanded, setBottomEdgeExpanded] = useState()
  const [leftEdgeExpanded, setLeftEdgeExpanded] = useState()
  const [allowedDrop, setAllowedDrop] = useState(false)
  const [selected, setSelected] = useState(false)

  const nodeClass = [
    'oc-node',
    isChildrenCollapsed ? 'isChildrenCollapsed' : '',
    allowedDrop ? 'allowedDrop' : '',
    selected ? 'selected' : ''
  ]
    .filter(item => item)
    .join(' ')

  useEffect(() => {
    const subs1 = dragNodeService.getDragInfo().subscribe(draggedInfo => {
      if (draggedInfo) {
        setAllowedDrop(
          !document
            .querySelector('#' + draggedInfo.draggedNodeId)
            .closest('li')
            .querySelector('#' + node.current.id)
            ? true
            : false
        )
      } else {
        setAllowedDrop(false)
      }
    })

    const subs2 = selectNodeService.getSelectedNodeInfo().subscribe(selectedNodeInfo => {
      if (selectedNodeInfo) {
        if (multipleSelect) {
          if (selectedNodeInfo.selectedNodeId === datasource.id) {
            setSelected(true)
          }
        } else {
          setSelected(selectedNodeInfo.selectedNodeId === datasource.id)
        }
      } else {
        setSelected(false)
      }
    })

    return () => {
      subs1.unsubscribe()
      subs2.unsubscribe()
    }
  }, [multipleSelect, datasource])

  const addArrows = e => {
    const node = e.target.closest('li')
    const parent = node.parentNode.closest('li')
    const isAncestorsCollapsed = node && parent ? parent.firstChild.classList.contains('hidden') : undefined
    const isSiblingsCollapsed = Array.from(node.parentNode.children).some(item => item.classList.contains('hidden'))

    setTopEdgeExpanded(!isAncestorsCollapsed)
    setRightEdgeExpanded(!isSiblingsCollapsed)
    setLeftEdgeExpanded(!isSiblingsCollapsed)
    setBottomEdgeExpanded(!isChildrenCollapsed)
  }

  const removeArrows = () => {
    setTopEdgeExpanded(undefined)
    setRightEdgeExpanded(undefined)
    setBottomEdgeExpanded(undefined)
    setLeftEdgeExpanded(undefined)
  }

  const toggleAncestors = actionNode => {
    let node = actionNode.parentNode.closest('li')
    if (!node) return
    const isAncestorsCollapsed = node.firstChild.classList.contains('hidden')
    if (isAncestorsCollapsed) {
      actionNode.classList.remove('isAncestorsCollapsed')
      node.firstChild.classList.remove('hidden')
    } else {
      const isSiblingsCollapsed = Array.from(actionNode.parentNode.children).some(item =>
        item.classList.contains('hidden')
      )
      if (!isSiblingsCollapsed) {
        toggleSiblings(actionNode)
      }
      actionNode.classList.add(
        ...('isAncestorsCollapsed' + (isSiblingsCollapsed ? '' : ' isSiblingsCollapsed')).split(' ')
      )
      node.firstChild.classList.add('hidden')
      if (node.parentNode.closest('li') && !node.parentNode.closest('li').firstChild.classList.contains('hidden')) {
        toggleAncestors(node)
      }
    }
  }

  const topEdgeClickHandler = e => {
    e.stopPropagation()
    setTopEdgeExpanded(!topEdgeExpanded)
    toggleAncestors(e.target.closest('li'))
  }

  const bottomEdgeClickHandler = e => {
    e.stopPropagation()
    setIsChildrenCollapsed(!isChildrenCollapsed)
    setBottomEdgeExpanded(!bottomEdgeExpanded)
  }

  const toggleSiblings = actionNode => {
    let node = actionNode.previousSibling

    const isSiblingsCollapsed = Array.from(actionNode.parentNode.children).some(item =>
      item.classList.contains('hidden')
    )

    actionNode.classList.toggle('isSiblingsCollapsed', !isSiblingsCollapsed)
    while (node) {
      if (isSiblingsCollapsed) {
        node.classList.remove('hidden')
      } else {
        node.classList.add('hidden')
      }
      node = node.previousSibling
    }
    node = actionNode.nextSibling
    while (node) {
      if (isSiblingsCollapsed) {
        node.classList.remove('hidden')
      } else {
        node.classList.add('hidden')
      }
      node = node.nextSibling
    }

    const isAncestorsCollapsed = actionNode.parentNode.closest('li').firstChild.classList.contains('hidden')
    if (isAncestorsCollapsed) {
      toggleAncestors(actionNode)
    }
  }

  const hEdgeClickHandler = e => {
    e.stopPropagation()
    setLeftEdgeExpanded(!leftEdgeExpanded)
    setRightEdgeExpanded(!rightEdgeExpanded)
    toggleSiblings(e.target.closest('li'))
  }

  const filterAllowedDropNodes = id => {
    dragNodeService.sendDragInfo(id)
  }

  const clickNodeHandler = event => {
    if (onClickNode) {
      onClickNode(datasource)
    }

    selectNodeService.sendSelectedNodeInfo(datasource.id)
  }

  const dragstartHandler = event => {
    const copyDS = { ...datasource }
    delete copyDS.relationship
    event.dataTransfer.setData('text/plain', JSON.stringify(copyDS))
    filterAllowedDropNodes(node.current.id)
  }

  const dragoverHandler = event => {
    event.preventDefault()
  }

  const dragendHandler = () => {
    dragNodeService.clearDragInfo()
  }

  const dropHandler = event => {
    if (!event.currentTarget.classList.contains('allowedDrop')) {
      return
    }
    dragNodeService.clearDragInfo()
    changeHierarchy(JSON.parse(event.dataTransfer.getData('text/plain')), event.currentTarget.id)
  }

  return (
    <li className='oc-hierarchy'>
      <div
        ref={node}
        id={datasource.id}
        className={nodeClass}
        draggable={draggable ? 'true' : undefined}
        onClick={clickNodeHandler}
        onDragStart={dragstartHandler}
        onDragOver={dragoverHandler}
        onDragEnd={dragendHandler}
        onDrop={dropHandler}
        onMouseEnter={addArrows}
        onMouseLeave={removeArrows}
      >
        {NodeTemplate ? (
          <NodeTemplate nodeData={datasource} />
        ) : (

          <Card sx={{ border: 0, boxShadow: 0, color: 'common.white', backgroundColor: '#189ab4' }}>
            
          <CardContent sx={{ p: theme => `${theme.spacing(3.25, 5, 4.5)} !important` }}>
            <Typography
              variant='h6'
              sx={{ display: 'flex', mr: 2.75, alignItems: '', color: 'common.white', '& svg': { mr: 2.5 } }}
            >
              {datasource.name}
          
            </Typography>
           <Typography  sx={{ color: '#D8D8D8' }}>
             <small>{datasource.employeesCount ?? 0} Employees</small> 
              </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
                <Avatar alt={datasource.logo} src={datasource.logo} sx={{ width: 34, height: 34, mr: 2.75 , borderStyle:'solid' , borderWidth:'1px' , borderColor:'#808080'}} />
                <Typography variant='body2' sx={{ color: 'common.white' }}>
                  {datasource.mng}
                </Typography>
              </Box>
            
            </Box>
            <Accordion slotProps={{textField:{size: 'small', fullWidth: false } }} expandIcon={ '+' }
            >
              <AccordionSummary>
                Employees
              </AccordionSummary>
              <AccordionDetails>
              <Typography>
                <ul>
                  {
                    datasource.employees && 
                    datasource.employees?.map((employee)=>{
                      employee = employee?.[0];
                      console.log('abc',employee);
                      if(!employee){
                        return <></>;
                      }

                      return (
                        <li key={employee?.id}>
                          {employee?.firstName + " " + employee?.lastName}
                        </li>
                      )
                    })
                  }
                </ul>
              </Typography>
            </AccordionDetails>
            </Accordion>
          </CardContent>
        </Card>

          // <>
          //   <div className='oc-heading'>{datasource.name}</div>
          //   <div className='oc-content'>{datasource.title}</div>
          // </>
        )}
        {collapsible && datasource.relationship && datasource.relationship.charAt(0) === '1' && (
          <i
            className={`oc-edge verticalEdge topEdge oci ${
              topEdgeExpanded === undefined ? '' : topEdgeExpanded ? 'oci-chevron-down' : 'oci-chevron-up'
            }`}
            onClick={topEdgeClickHandler}
          />
        )}
        {collapsible && datasource.relationship && datasource.relationship.charAt(1) === '1' && (
          <>
            <i
              className={`oc-edge horizontalEdge rightEdge oci ${
                rightEdgeExpanded === undefined ? '' : rightEdgeExpanded ? 'oci-chevron-left' : 'oci-chevron-right'
              }`}
              onClick={hEdgeClickHandler}
            />
            <i
              className={`oc-edge horizontalEdge leftEdge oci ${
                leftEdgeExpanded === undefined ? '' : leftEdgeExpanded ? 'oci-chevron-right' : 'oci-chevron-left'
              }`}
              onClick={hEdgeClickHandler}
            />
          </>
        )}
        {collapsible && datasource.relationship && datasource.relationship.charAt(2) === '1' && (
          <i
            className={`oc-edge verticalEdge bottomEdge oci ${
              bottomEdgeExpanded === undefined ? '' : bottomEdgeExpanded ? 'oci-chevron-up' : 'oci-chevron-down'
            }`}
            onClick={bottomEdgeClickHandler}
          />
        )}
      </div>
      {datasource.children && datasource.children.length > 0 && (
        <ul className={isChildrenCollapsed ? 'hidden' : ''}>
          {datasource.children.map(node => (
            <ChartNode
              datasource={node}
              NodeTemplate={NodeTemplate}
              id={node.id}
              key={node.id}
              draggable={draggable}
              collapsible={collapsible}
              multipleSelect={multipleSelect}
              changeHierarchy={changeHierarchy}
              onClickNode={onClickNode}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

ChartNode.propTypes = propTypes
ChartNode.defaultProps = defaultProps

export default ChartNode
